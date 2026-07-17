'use client'

import { useState, useEffect, useRef } from 'react'
import { PDFDocument, StandardFonts, rgb, TextAlignment, PDFName, PDFHexString } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Set the worker source dynamically to match the installed pdfjs-dist version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

interface FormField {
  id: string
  type: 'text' | 'checkbox' | 'signature' | 'image'
  name: string
  page: number
  x: number // percentage from left (0 - 100)
  y: number // percentage from top (0 - 100)
  width: number // pixels
  height: number // pixels
  placeholder: string
  defaultValue: string
  required: boolean
  fontSize: number
  textColor: 'black' | 'blue' | 'red'
  alignment: 'left' | 'center' | 'right'
  multiline: boolean
  
  // Electronic Signature values
  signatureType?: 'typed' | 'drawn'
  signatureValue?: string // base64 PNG data url
  signatureFont?: string // cursive font family
  
  // Image Upload values
  imageValue?: string // base64 PNG/JPG data url
}

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'checkbox' | 'signature' | 'image'>('select')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Zoom scale state (default 1.2 which is 120%)
  const [zoom, setZoom] = useState<number>(1.2)
  const [activePage, setActivePage] = useState<number>(1)

  // Undo/Redo history stack
  const [history, setHistory] = useState<FormField[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Click-and-drag drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawPageNum, setDrawPageNum] = useState<number | null>(null)
  const [drawingBox, setDrawingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Adopt Signature modal state
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false)
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null)
  const [signatureTab, setSignatureTab] = useState<'type' | 'draw'>('type')
  const [typedName, setTypedName] = useState('')
  const [selectedFont, setSelectedFont] = useState('Alex Brush')
  const [isDrawingSig, setIsDrawingSig] = useState(false)
  const [copiedField, setCopiedField] = useState<FormField | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sigCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawingCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  // Inject Google Fonts stylesheet dynamically
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Caveat:wght@700&family=Great+Vibes&family=Pacifico&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // History helpers
  const commitHistory = (newFields: FormField[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1)
    updatedHistory.push(newFields)
    setHistory(updatedHistory)
    setHistoryIndex(updatedHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      setFields(history[prevIndex])
      setSelectedFieldId(null)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setFields(history[nextIndex])
      setSelectedFieldId(null)
    }
  }

  // Keyboard Shortcuts & precision nudge events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore hotkeys if user is editing inside input text fields or if signing modal is open
      const activeEl = document.activeElement
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return
      }
      if (isSigningModalOpen) return

      // Deletion
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldId) {
        e.preventDefault()
        const nextFields = fields.filter(f => f.id !== selectedFieldId)
        setFields(nextFields)
        commitHistory(nextFields)
        setSelectedFieldId(null)
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedFieldId) {
        e.preventDefault()
        duplicateField(selectedFieldId)
      }

      // Tool toggling hotkeys
      if (e.key.toLowerCase() === 'v') setActiveTool('select')
      if (e.key.toLowerCase() === 't') setActiveTool('text')
      if (e.key.toLowerCase() === 'k') setActiveTool('checkbox')
      if (e.key.toLowerCase() === 's') setActiveTool('signature')
      if (e.key.toLowerCase() === 'i') setActiveTool('image')

      // Nudging with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedFieldId) {
        e.preventDefault()
        const nudgeAmount = e.shiftKey ? 1.0 : 0.1 // percentage movements
        
        const nextFields = fields.map(f => {
          if (f.id === selectedFieldId) {
            let nextX = f.x
            let nextY = f.y
            if (e.key === 'ArrowLeft') nextX = Math.max(0, f.x - nudgeAmount)
            if (e.key === 'ArrowRight') nextX = Math.min(100, f.x + nudgeAmount)
            if (e.key === 'ArrowUp') nextY = Math.max(0, f.y - nudgeAmount)
            if (e.key === 'ArrowDown') nextY = Math.min(100, f.y + nudgeAmount)
            return { ...f, x: nextX, y: nextY }
          }
          return f
        })
        setFields(nextFields)
        commitHistory(nextFields)
      }

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedFieldId) {
        const target = fields.find(f => f.id === selectedFieldId)
        if (target) {
          e.preventDefault()
          setCopiedField(target)
        }
      }

      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && copiedField) {
        e.preventDefault()
        const typeCount = fields.filter(f => f.type === copiedField.type).length + 1
        const labelName = 
          copiedField.type === 'text' ? 'Text' : 
          copiedField.type === 'checkbox' ? 'Checkbox' : 
          copiedField.type === 'signature' ? 'Signature' : 'Image'
        
        const offsetPercent = 3
        const newX = Math.min(90, copiedField.x + offsetPercent)
        const newY = Math.min(90, copiedField.y + offsetPercent)
        
        const pasteDuplicate: FormField = {
          ...copiedField,
          id: `${copiedField.type}_${Date.now()}`,
          name: `${labelName}_${typeCount}`,
          x: newX,
          y: newY,
        }
        
        const nextFields = [...fields, pasteDuplicate]
        setFields(nextFields)
        commitHistory(nextFields)
        setSelectedFieldId(pasteDuplicate.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFieldId, fields, activeTool, historyIndex, history, isSigningModalOpen, copiedField])
  
  // Clean up states when file changes
  const resetEditor = () => {
    setFile(null)
    setPdfDoc(null)
    setNumPages(0)
    setFields([])
    setSelectedFieldId(null)
    setActiveTool('select')
    setError(null)
    setIsDrawing(false)
    setDrawStart(null)
    setDrawPageNum(null)
    setDrawingBox(null)
    setHistory([[]])
    setHistoryIndex(0)
    setZoom(1.2)
    setActivePage(1)
    setCopiedField(null)
  }

  // Load PDF with PDFJS
  const loadPdfFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file.')
      return
    }
    
    setLoading(true)
    setError(null)
    setFile(selectedFile)
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const typedArray = new Uint8Array(arrayBuffer)
      const loadingTask = pdfjsLib.getDocument({ data: typedArray })
      const doc = await loadingTask.promise
      setPdfDoc(doc)
      setNumPages(doc.numPages)
      setHistory([[]])
      setHistoryIndex(0)
      setActivePage(1)
    } catch (err: any) {
      console.error('Error loading PDF:', err)
      setError('Failed to parse the PDF document. It may be password-protected or corrupted.')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdfFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadPdfFile(e.dataTransfer.files[0])
    }
  }

  // Render individual pages and thumbnails onto their canvases
  useEffect(() => {
    if (!pdfDoc) return

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum)
          
          // 1. Render Main Editor Canvas
          const viewport = page.getViewport({ scale: zoom }) // apply zoom scale
          const canvas = document.getElementById(`pdf-canvas-${pageNum}`) as HTMLCanvasElement
          if (canvas) {
            const context = canvas.getContext('2d')
            if (context) {
              canvas.height = viewport.height
              canvas.width = viewport.width
              const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
              }
              await page.render(renderContext).promise
            }
          }

          // 2. Render Left Sidebar Preview Thumbnail Canvas (fixed scale: 0.15)
          const thumbCanvas = document.getElementById(`pdf-thumbnail-canvas-${pageNum}`) as HTMLCanvasElement
          if (thumbCanvas) {
            const thumbViewport = page.getViewport({ scale: 0.15 })
            const thumbContext = thumbCanvas.getContext('2d')
            if (thumbContext) {
              thumbCanvas.height = thumbViewport.height
              thumbCanvas.width = thumbViewport.width
              const thumbRenderContext = {
                canvasContext: thumbContext,
                viewport: thumbViewport,
                canvas: thumbCanvas,
              }
              await page.render(thumbRenderContext).promise
            }
          }
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err)
        }
      }
    }

    renderAllPages()
  }, [pdfDoc, numPages, zoom])

  // Intersection Observer to dynamically highlight left active page thumbnail during scroll
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return

    const observerOptions = {
      root: containerRef.current,
      threshold: 0.35, // 35% of the page is in the viewport
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageId = entry.target.id
          const pageNum = parseInt(pageId.split('-').pop() || '1', 10)
          setActivePage(pageNum)
        }
      })
    }, observerOptions)

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageEl = document.getElementById(`page-container-${pageNum}`)
      if (pageEl) observer.observe(pageEl)
    }

    return () => observer.disconnect()
  }, [pdfDoc, numPages])

  // Handle clicking & dragging to draw interactive fields
  const handlePageMouseDown = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (activeTool === 'select') return
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const startXPercent = ((e.clientX - rect.left) / rect.width) * 100
    const startYPercent = ((e.clientY - rect.top) / rect.height) * 100
    
    setIsDrawing(true)
    setDrawStart({ x: e.clientX, y: e.clientY })
    setDrawPageNum(pageNum)
    setDrawingBox({
      x: startXPercent,
      y: startYPercent,
      width: 0,
      height: 0,
    })
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX
      const currentY = moveEvent.clientY
      
      const deltaXPixels = currentX - e.clientX
      const deltaYPixels = currentY - e.clientY
      
      const widthPercent = (deltaXPixels / rect.width) * 100
      const heightPercent = (deltaYPixels / rect.height) * 100
      
      const x = widthPercent < 0 ? startXPercent + widthPercent : startXPercent
      const y = heightPercent < 0 ? startYPercent + heightPercent : startYPercent
      const w = Math.abs(widthPercent)
      const h = Math.abs(heightPercent)
      
      setDrawingBox({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        width: Math.max(0, Math.min(100 - x, w)),
        height: Math.max(0, Math.min(100 - y, h)),
      })
    }
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      setIsDrawing(false)
      setDrawStart(null)
      setDrawPageNum(null)
      setDrawingBox(null)
      
      // Calculate drawn dimensions in pixels
      const deltaX = Math.abs(upEvent.clientX - e.clientX)
      const deltaY = Math.abs(upEvent.clientY - e.clientY)
      
      const typeCount = fields.filter(f => f.type === activeTool).length + 1
      
      let labelName = 'Text'
      if (activeTool === 'checkbox') labelName = 'Checkbox'
      if (activeTool === 'signature') labelName = 'Signature'
      if (activeTool === 'image') labelName = 'Image'
      
      let newField: FormField

      // If drawing gesture is tiny (under 10px), fall back to default click-to-place dimensions
      if (deltaX < 10 && deltaY < 10) {
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100
        
        newField = {
          id: `${activeTool}_${Date.now()}`,
          type: activeTool,
          name: `${labelName}_${typeCount}`,
          page: pageNum,
          x: Math.max(0, Math.min(100, xPercent)),
          y: Math.max(0, Math.min(100, yPercent)),
          width: activeTool === 'text' ? 150 : activeTool === 'checkbox' ? 20 : activeTool === 'signature' ? 160 : 120,
          height: activeTool === 'text' ? 26 : activeTool === 'checkbox' ? 20 : activeTool === 'signature' ? 42 : 120,
          placeholder: activeTool === 'text' ? 'Enter text...' : activeTool === 'signature' ? 'Click to Sign' : 'Click to Upload (Open in Acrobat Reader)',
          defaultValue: '',
          required: false,
          fontSize: 11,
          textColor: 'black',
          alignment: 'left',
          multiline: false,
        }
      } else {
        // Create custom sized field
        const endXPercent = ((upEvent.clientX - rect.left) / rect.width) * 100
        const endYPercent = ((upEvent.clientY - rect.top) / rect.height) * 100
        
        const finalX = Math.min(startXPercent, endXPercent)
        const finalY = Math.min(startYPercent, endYPercent)
        
        newField = {
          id: `${activeTool}_${Date.now()}`,
          type: activeTool,
          name: `${labelName}_${typeCount}`,
          page: pageNum,
          x: Math.max(0, Math.min(100, finalX)),
          y: Math.max(0, Math.min(100, finalY)),
          width: deltaX,
          height: deltaY,
          placeholder: activeTool === 'text' ? 'Enter text...' : activeTool === 'signature' ? 'Click to Sign' : 'Click to Upload (Open in Acrobat Reader)',
          defaultValue: '',
          required: false,
          fontSize: 11,
          textColor: 'black',
          alignment: 'left',
          multiline: false,
        }
      }

      const updatedFields = [...fields, newField]
      setFields(updatedFields)
      commitHistory(updatedFields)
      setSelectedFieldId(newField.id)
      
      // Auto trigger triggers if signature or image is placed
      if (newField.type === 'signature') {
        openSigningPad(newField.id)
      } else if (newField.type === 'image') {
        triggerImageSelection(newField.id)
      }
      
      setActiveTool('select') // revert tool
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle drag mechanics (including Alt + Drag Copy)
  const handleFieldDragStart = (e: React.MouseEvent, fieldId: string, pageNum: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    const field = fields.find(f => f.id === fieldId)
    if (!field) return
    
    let targetFieldId = fieldId
    let currentFieldsSnapshot = [...fields]
    
    // Alt + Drag Duplication check
    if (e.altKey) {
      const typeCount = fields.filter(f => f.type === field.type).length + 1
      const labelName = 
        field.type === 'text' ? 'Text' : 
        field.type === 'checkbox' ? 'Checkbox' : 
        field.type === 'signature' ? 'Signature' : 'Image'
      
      const duplicate: FormField = {
        ...field,
        id: `${field.type}_${Date.now()}`,
        name: `${labelName}_${typeCount}`,
      }
      
      currentFieldsSnapshot = [...fields, duplicate]
      setFields(currentFieldsSnapshot)
      targetFieldId = duplicate.id
      setSelectedFieldId(duplicate.id)
    } else {
      setSelectedFieldId(fieldId)
    }
    
    const startX = e.clientX
    const startY = e.clientY
    
    const activeField = currentFieldsSnapshot.find(f => f.id === targetFieldId)
    if (!activeField) return
    
    const startXPercent = activeField.x
    const startYPercent = activeField.y
    
    const pageContainer = document.getElementById(`page-container-${pageNum}`)
    if (!pageContainer) return
    const rect = pageContainer.getBoundingClientRect()
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaXPercent = ((moveEvent.clientX - startX) / rect.width) * 100
      const deltaYPercent = ((moveEvent.clientY - startY) / rect.height) * 100
      
      const widthPercent = (activeField.width / rect.width) * 100
      const heightPercent = (activeField.height / rect.height) * 100
      
      currentFieldsSnapshot = currentFieldsSnapshot.map(f => {
        if (f.id === targetFieldId) {
          return {
            ...f,
            x: Math.max(0, Math.min(100 - widthPercent, startXPercent + deltaXPercent)),
            y: Math.max(0, Math.min(100 - heightPercent, startYPercent + deltaYPercent)),
          }
        }
        return f
      })
      setFields(currentFieldsSnapshot)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // Commit final drag coordinate state to history
      commitHistory(currentFieldsSnapshot)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle professional 8-point resizing mechanics
  const handleResizeStart = (
    e: React.MouseEvent, 
    fieldId: string, 
    pageNum: number,
    handleType: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    
    const startX = e.clientX
    const startY = e.clientY
    
    const field = fields.find(f => f.id === fieldId)
    if (!field) return
    
    const startXPercent = field.x
    const startYPercent = field.y
    const startWidth = field.width
    const startHeight = field.height
    
    const pageContainer = document.getElementById(`page-container-${pageNum}`)
    if (!pageContainer) return
    const rect = pageContainer.getBoundingClientRect()
    
    let currentFieldsSnapshot = [...fields]

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      const deltaXPercent = (deltaX / rect.width) * 100
      const deltaYPercent = (deltaY / rect.height) * 100
      
      let nextX = startXPercent
      let nextY = startYPercent
      let nextWidth = startWidth
      let nextHeight = startHeight

      switch (handleType) {
        case 'br':
          nextWidth = startWidth + deltaX
          nextHeight = startHeight + deltaY
          break
        case 'bl':
          nextWidth = startWidth - deltaX
          nextX = startXPercent + deltaXPercent
          nextHeight = startHeight + deltaY
          break
        case 'tr':
          nextWidth = startWidth + deltaX
          nextHeight = startHeight - deltaY
          nextY = startYPercent + deltaYPercent
          break
        case 'tl':
          nextWidth = startWidth - deltaX
          nextX = startXPercent + deltaXPercent
          nextHeight = startHeight - deltaY
          nextY = startYPercent + deltaYPercent
          break
        case 't':
          nextHeight = startHeight - deltaY
          nextY = startYPercent + deltaYPercent
          break
        case 'b':
          nextHeight = startHeight + deltaY
          break
        case 'l':
          nextWidth = startWidth - deltaX
          nextX = startXPercent + deltaXPercent
          break
        case 'r':
          nextWidth = startWidth + deltaX
          break
      }

      // Constraints
      if (nextWidth < 15) {
        if (handleType === 'tl' || handleType === 'bl' || handleType === 'l') {
          nextX = startXPercent + ((startWidth - 15) / rect.width) * 100
        }
        nextWidth = 15
      }
      if (nextHeight < 10) {
        if (handleType === 'tl' || handleType === 'tr' || handleType === 't') {
          nextY = startYPercent + ((startHeight - 10) / rect.height) * 100
        }
        nextHeight = 10
      }

      currentFieldsSnapshot = fields.map(f => {
        if (f.id === fieldId) {
          return {
            ...f,
            x: Math.max(0, Math.min(100, nextX)),
            y: Math.max(0, Math.min(100, nextY)),
            width: nextWidth,
            height: nextHeight,
          }
        }
        return f
      })
      setFields(currentFieldsSnapshot)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // Commit final resized state to history
      commitHistory(currentFieldsSnapshot)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Copy / Duplicate Field
  const duplicateField = (fieldId: string) => {
    const original = fields.find(f => f.id === fieldId)
    if (!original) return
    
    const typeCount = fields.filter(f => f.type === original.type).length + 1
    const labelName = 
      original.type === 'text' ? 'Text' : 
      original.type === 'checkbox' ? 'Checkbox' : 
      original.type === 'signature' ? 'Signature' : 'Image'
    
    // Offset slightly (3%), constraint mapping
    const offsetPercent = 3
    const newX = Math.min(90, original.x + offsetPercent)
    const newY = Math.min(90, original.y + offsetPercent)
    
    const duplicate: FormField = {
      ...original,
      id: `${original.type}_${Date.now()}`,
      name: `${labelName}_${typeCount}`,
      x: newX,
      y: newY,
    }
    
    const updatedFields = [...fields, duplicate]
    setFields(updatedFields)
    commitHistory(updatedFields)
    setSelectedFieldId(duplicate.id)
  }

  // Handle editing properties
  const updateFieldProperty = (fieldId: string, properties: Partial<FormField>) => {
    const updated = fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, ...properties }
      }
      return f
    })
    setFields(updated)
    commitHistory(updated)
  }

  // Handle deleting a field
  const deleteField = (fieldId: string) => {
    const updated = fields.filter(f => f.id !== fieldId)
    setFields(updated)
    commitHistory(updated)
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }

  // Clear all fields
  const clearAllFields = () => {
    setFields([])
    commitHistory([])
    setSelectedFieldId(null)
  }

  // ── Image Selection & Upload handlers ──
  const triggerImageSelection = (fieldId: string) => {
    setSelectedFieldId(fieldId)
    const inputEl = document.getElementById(`image-upload-input-${fieldId}`)
    if (inputEl) {
      inputEl.click()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          updateFieldProperty(fieldId, {
            imageValue: event.target.result as string,
            defaultValue: imgFile.name // save file name as default value metadata
          })
        }
      }
      reader.readAsDataURL(imgFile)
    }
  }

  // ── Adopt Signature Modal Drawing Logic ──
  const openSigningPad = (fieldId: string) => {
    setSigningFieldId(fieldId)
    const current = fields.find(f => f.id === fieldId)
    if (current) {
      if (current.signatureType === 'typed') {
        setSignatureTab('type')
        setTypedName(current.defaultValue || '')
        setSelectedFont(current.signatureFont || 'Alex Brush')
      } else {
        setSignatureTab('draw')
        setTypedName('')
      }
    }
    setIsSigningModalOpen(true)
  }

  // Set up drawing canvas context on tab select
  useEffect(() => {
    if (isSigningModalOpen && signatureTab === 'draw' && sigCanvasRef.current) {
      const canvas = sigCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#1e3a8a' // blue ink
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        drawingCtxRef.current = ctx
        
        // Fill canvas background with transparent color
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [isSigningModalOpen, signatureTab])

  const startSigDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!sigCanvasRef.current || !drawingCtxRef.current) return
    
    setIsDrawingSig(true)
    const ctx = drawingCtxRef.current
    const rect = sigCanvasRef.current.getBoundingClientRect()
    
    // Support mouse or touch coord checks
    let clientX = 0
    let clientY = 0
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig || !sigCanvasRef.current || !drawingCtxRef.current) return
    e.preventDefault()
    
    const ctx = drawingCtxRef.current
    const rect = sigCanvasRef.current.getBoundingClientRect()
    
    let clientX = 0
    let clientY = 0
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopSigDrawing = () => {
    setIsDrawingSig(false)
  }

  const clearSigCanvas = () => {
    if (sigCanvasRef.current && drawingCtxRef.current) {
      const canvas = sigCanvasRef.current
      drawingCtxRef.current.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Convert adopting values to base64 image and save
  const handleSaveSignature = () => {
    if (!signingFieldId) return
    
    let finalPngUrl = ''
    let type: 'typed' | 'drawn' = 'typed'
    let fontName = ''
    let textVal = ''
    
    if (signatureTab === 'type') {
      type = 'typed'
      fontName = selectedFont
      textVal = typedName || 'Sign Here'
      
      // Render text to offscreen canvas matching the signature block's aspect ratio at high-res (3x scale)
      const field = fields.find(f => f.id === signingFieldId)
      const boxWidth = field ? field.width : 160
      const boxHeight = field ? field.height : 42
      
      const offscreenCanvas = document.createElement('canvas')
      offscreenCanvas.width = boxWidth * 3
      offscreenCanvas.height = boxHeight * 3
      const ctx = offscreenCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)' // transparent background
        ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
        
        // Dynamically scale font size to occupy ~80% of the block height
        const fontSize = Math.round(offscreenCanvas.height * 0.8)
        ctx.font = `italic ${fontSize}px "${selectedFont}", cursive`
        ctx.fillStyle = '#1e3a8a' // blue ink
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(textVal, offscreenCanvas.width / 2, offscreenCanvas.height / 2)
        
        finalPngUrl = offscreenCanvas.toDataURL('image/png')
      }
    } else {
      // Draw canvas image export
      type = 'drawn'
      if (sigCanvasRef.current) {
        finalPngUrl = sigCanvasRef.current.toDataURL('image/png')
      }
    }
    
    const updated = fields.map(f => {
      if (f.id === signingFieldId) {
        return {
          ...f,
          signatureType: type,
          signatureValue: finalPngUrl,
          signatureFont: fontName,
          defaultValue: textVal, // store typed name/draw details
        }
      }
      return f
    })
    
    setFields(updated)
    commitHistory(updated)
    setIsSigningModalOpen(false)
    setSigningFieldId(null)
    setTypedName('')
  }

  // Compile and download fillable PDF using pdf-lib
  const handleDownload = async () => {
    if (!file) return
    setIsGenerating(true)
    setError(null)
    
    try {
      const fileBytes = await file.arrayBuffer()
      const pdfDocInstance = await PDFDocument.load(fileBytes)
      const form = pdfDocInstance.getForm()
      const helveticaFont = await pdfDocInstance.embedFont(StandardFonts.Helvetica)
      
      const pdfPages = pdfDocInstance.getPages()
      
      for (const field of fields) {
        if (field.page > pdfPages.length) continue
        const pageIndex = field.page - 1
        const page = pdfPages[pageIndex]
        const { width: pdfWidth, height: pdfHeight } = page.getSize()
        
        // Find DOM size of rendered page to perform scale conversion
        const pageContainer = document.getElementById(`page-container-${field.page}`)
        if (!pageContainer) continue
        
        const domRect = pageContainer.getBoundingClientRect()
        const scaleX = pdfWidth / domRect.width
        const scaleY = pdfHeight / domRect.height
        
        // Compute coordinates
        const x = (field.x / 100) * pdfWidth
        const fieldPdfWidth = field.width * scaleX
        const fieldPdfHeight = field.height * scaleY
        const y = pdfHeight - ((field.y / 100) * pdfHeight) - fieldPdfHeight

        // Text color parsing
        let textColorRGB = rgb(0, 0, 0) // default black
        if (field.textColor === 'blue') textColorRGB = rgb(0.1, 0.25, 0.65)
        if (field.textColor === 'red') textColorRGB = rgb(0.8, 0.1, 0.1)
        
        if (field.type === 'text') {
          const textField = form.createTextField(field.name)
          if (field.defaultValue) {
            textField.setText(field.defaultValue)
          }
          if (field.required) {
            textField.enableRequired()
          }
          if (field.multiline) {
            textField.enableMultiline()
          }

          // Set Text Alignment
          if (field.alignment === 'center') {
            textField.setAlignment(TextAlignment.Center)
          } else if (field.alignment === 'right') {
            textField.setAlignment(TextAlignment.Right)
          } else {
            textField.setAlignment(TextAlignment.Left)
          }
          
          textField.addToPage(page, {
            x,
            y,
            width: fieldPdfWidth,
            height: fieldPdfHeight,
            borderWidth: 0,
            borderColor: undefined,
            backgroundColor: undefined,
          })
          
          const da = textField.acroField.getDefaultAppearance() || '/Helv 12 Tf 0 g'
          let colorOperator = '0 g'
          if (field.textColor === 'blue') colorOperator = '0.1 0.25 0.65 rg'
          if (field.textColor === 'red') colorOperator = '0.8 0.1 0.1 rg'
          
          const tfIndex = da.indexOf('Tf')
          if (tfIndex !== -1) {
            textField.acroField.setDefaultAppearance(`${da.slice(0, tfIndex + 2)} ${colorOperator}`)
          } else {
            textField.acroField.setDefaultAppearance(`/Helv ${field.fontSize} Tf ${colorOperator}`)
          }
          
          textField.setFontSize(field.fontSize)
          textField.updateAppearances(helveticaFont)
        } else if (field.type === 'checkbox') {
          const checkBox = form.createCheckBox(field.name)
          if (field.defaultValue === 'true' || field.defaultValue === 'checked') {
            checkBox.check()
          }
          if (field.required) {
            checkBox.enableRequired()
          }
          
          checkBox.addToPage(page, {
            x,
            y,
            width: fieldPdfWidth,
            height: fieldPdfHeight,
          })
        } else if (field.type === 'signature') {
          // Check if signature has been adopted/placed by builder
          if (field.signatureValue) {
            const base64Data = field.signatureValue.split(',')[1]
            const binaryString = window.atob(base64Data)
            const len = binaryString.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            
            // Draw visual PNG signature statically onto the PDF page
            const pngImage = await pdfDocInstance.embedPng(bytes)
            page.drawImage(pngImage, {
              x,
              y,
              width: fieldPdfWidth,
              height: fieldPdfHeight,
            })
          }
        } else if (field.type === 'image') {
          // 1. Draw pre-uploaded image/logo if present
          if (field.imageValue) {
            const base64Data = field.imageValue.split(',')[1]
            const mimeType = field.imageValue.split(';')[0].split(':')[1]
            
            const binaryString = window.atob(base64Data)
            const len = binaryString.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            
            let imgPayload
            if (mimeType === 'image/png') {
              imgPayload = await pdfDocInstance.embedPng(bytes)
            } else {
              imgPayload = await pdfDocInstance.embedJpg(bytes)
            }
            
            page.drawImage(imgPayload, {
              x,
              y,
              width: fieldPdfWidth,
              height: fieldPdfHeight,
            })
          }

          // 2. Create the interactive AcroForm Button overlay
          // Clicking this button inside the PDF viewer runs Acrobat JavaScript to import a local image.
          const buttonField = form.createButton(field.name)
          
          buttonField.addToPage(field.imageValue ? '' : (field.placeholder || 'Click to Upload Image'), page, {
            x,
            y,
            width: fieldPdfWidth,
            height: fieldPdfHeight,
            borderWidth: field.imageValue ? 0 : 1,
            borderColor: field.imageValue ? undefined : rgb(0.7, 0.7, 0.7),
            backgroundColor: field.imageValue ? undefined : rgb(0.95, 0.95, 0.95),
          })
          
          const importScript = 'event.target.buttonImportIcon();'
          buttonField.acroField.getWidgets().forEach((widget) => {
            widget.dict.set(
              PDFName.of('AA'),
              pdfDocInstance.context.obj({
                U: {
                  Type: 'Action',
                  S: 'JavaScript',
                  JS: PDFHexString.fromText(importScript),
                },
              })
            )
          })
        }
      }
      
      const pdfBytes = await pdfDocInstance.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      
      // Append "_signed"
      const nameParts = file.name.split('.')
      const extension = nameParts.pop()
      const newName = `${nameParts.join('.')}_signed.${extension}`
      
      link.download = newName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      console.error('Error creating PDF:', err)
      setError('An error occurred while compiling the PDF document. Ensure field names are unique.')
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedField = fields.find(f => f.id === selectedFieldId)

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-[#172135] border border-slate-200 dark:border-[#243550] rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
      
      {/* ── Editor Toolbar Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#243550] z-10 select-none transition-colors duration-300">
        
        {/* Left Section: File Name & Stats */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <button 
            onClick={resetEditor}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200"
            title="Back to Tools"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="truncate">
            <h2 className="font-extrabold text-[#0a1628] dark:text-white tracking-tight truncate max-w-[200px]" title={file ? file.name : ''}>
              {file ? file.name : 'Fillable PDF Creator'}
            </h2>
            {file && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold mt-0.5 uppercase tracking-wider">
                {numPages} {numPages === 1 ? 'page' : 'pages'} • {fields.length} {fields.length === 1 ? 'field' : 'fields'}
              </p>
            )}
          </div>
        </div>

        {file && (
          <>
            {/* Center Section: Floating Element Toolbar & History & Zoom */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#172135] p-1.5 rounded-2xl border border-slate-200 dark:border-[#243550] transition-colors duration-300">
              
              {/* Interactive Tools */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTool('select')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTool === 'select'
                      ? 'bg-white text-[#0a1628] dark:bg-[#0f172a] dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-[#243550]'
                      : 'text-slate-500 hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Pointer Tool (V)"
                >
                  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                  </svg>
                  <span className="hidden lg:inline">Select</span>
                </button>
                
                <button
                  onClick={() => setActiveTool('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTool === 'text'
                      ? 'bg-white text-[#0a1628] dark:bg-[#0f172a] dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-[#243550]'
                      : 'text-slate-500 hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Text Box (T)"
                >
                  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="9" y1="4" x2="15" y2="4" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                  </svg>
                  <span className="hidden lg:inline">Text Box</span>
                </button>

                <button
                  onClick={() => setActiveTool('checkbox')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTool === 'checkbox'
                      ? 'bg-white text-[#0a1628] dark:bg-[#0f172a] dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-[#243550]'
                      : 'text-slate-500 hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Checkbox (K)"
                >
                  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 11l3 3 5-5" />
                  </svg>
                  <span className="hidden lg:inline">Checkbox</span>
                </button>

                <button
                  onClick={() => setActiveTool('signature')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTool === 'signature'
                      ? 'bg-white text-[#0a1628] dark:bg-[#0f172a] dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-[#243550]'
                      : 'text-slate-500 hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Signature (S)"
                >
                  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    <path d="M19 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
                  </svg>
                  <span className="hidden lg:inline">Signature</span>
                </button>

                <button
                  onClick={() => setActiveTool('image')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTool === 'image'
                      ? 'bg-white text-[#0a1628] dark:bg-[#0f172a] dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-[#243550]'
                      : 'text-slate-500 hover:text-[#0a1628] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Image Field (I)"
                >
                  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="hidden lg:inline">Image</span>
                </button>
              </div>

              {/* Undo / Redo Separator */}
              <div className="h-6 w-px bg-slate-200 dark:bg-[#243550]" />

              {/* Undo / Redo Controls */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={undo}
                  disabled={historyIndex === 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Undo (Ctrl+Z)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                  </svg>
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Redo (Ctrl+Y)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                  </svg>
                </button>
              </div>

              {/* Zoom Separator */}
              <div className="h-6 w-px bg-slate-200 dark:bg-[#243550]" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(prev => Math.max(0.6, prev - 0.2))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Zoom Out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 min-w-[36px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(prev => Math.min(2.0, prev + 0.2))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0a1628] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Zoom In"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFields}
                disabled={fields.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-red-600 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating || fields.length === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#0a1628] hover:bg-[#1a3a6b] dark:bg-amber-400 dark:text-[#0a1628] dark:hover:bg-amber-500 transition-all duration-200 shadow-sm shadow-[#0a1628]/10 hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white dark:text-[#0a1628]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Compiling...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Editor Canvas Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {!file ? (
          /* ── Drag & Drop Upload Zone ── */
          <div 
            className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50 dark:bg-[#172135] transition-colors duration-300"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="max-w-md w-full p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#0a1628]/40 dark:hover:border-amber-400/40 bg-white dark:bg-[#0f172a]/60 hover:bg-slate-50 dark:hover:bg-[#0a1628]/60 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-md"
            >
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <div className="w-16 h-16 rounded-2xl bg-[#0a1628]/5 dark:bg-amber-400/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="text-[#0a1628] dark:text-amber-400 w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
              </div>
              <h3 className="text-[#0a1628] dark:text-white font-extrabold text-lg tracking-tight mb-2">
                Upload a static PDF
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold max-w-[280px] leading-relaxed mb-6">
                Drag & drop your PDF file here, or click to browse files from your computer.
              </p>
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-50 dark:bg-[#172135] shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0a1628] dark:text-amber-400">
                Supports up to 25MB
              </span>
            </div>
            
            {error && (
              <div className="mt-6 max-w-md w-full p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex gap-3 text-red-700 dark:text-red-400 transition-all">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-xs font-bold leading-relaxed">{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* ── PDF Workbench ── */
          <>
            {/* 1. Left Page Preview Sidebar (Acrobat style) */}
            <div className="w-48 border-r border-slate-200 dark:border-[#243550] bg-slate-50/40 dark:bg-[#0f172a]/30 flex flex-col flex-shrink-0 select-none overflow-y-auto p-4 gap-4 scrollbar-thin transition-colors duration-300">
              <div className="flex flex-col gap-5">
                {Array.from({ length: numPages }).map((_, i) => {
                  const pageNum = i + 1
                  const isActive = activePage === pageNum
                  return (
                    <div
                      key={pageNum}
                      onClick={() => {
                        setActivePage(pageNum)
                        document.getElementById(`page-container-${pageNum}`)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start'
                        })
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      {/* Thumbnail frame */}
                      <div className={`p-1 rounded-xl bg-white shadow-sm border-2 transition-all overflow-hidden ${
                        isActive
                          ? 'border-[#0a1628] dark:border-amber-400 ring-4 ring-[#0a1628]/10 dark:ring-amber-400/10 shadow-md'
                          : 'border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-700'
                      }`}>
                        <canvas
                          id={`pdf-thumbnail-canvas-${pageNum}`}
                          className="block rounded-lg"
                          style={{ width: '100%', height: 'auto', maxHeight: '160px' }}
                        />
                      </div>
                      
                      {/* Thumbnail indicator label */}
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        isActive ? 'text-[#0a1628] dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`}>
                        Page {pageNum}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Scrollable Canvas Board */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto p-8 bg-slate-100/50 dark:bg-[#0a1628]/60 flex flex-col items-center gap-8 relative select-none scroll-smooth transition-colors duration-300"
            >
              {loading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-[#172135]/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0a1628] dark:border-amber-400" />
                  <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">Loading pages...</p>
                </div>
              )}

              {Array.from({ length: numPages }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <div 
                    key={pageNum}
                    id={`page-container-${pageNum}`}
                    className="relative bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-slate-200/40 dark:border-[#243550]/40 overflow-hidden flex-shrink-0"
                    style={{ minWidth: '300px' }}
                  >
                    {/* Rendered PDF Canvas */}
                    <canvas id={`pdf-canvas-${pageNum}`} className="block" />
                    
                    {/* Overlay Grid / Field Target */}
                    <div 
                      onMouseDown={(e) => handlePageMouseDown(e, pageNum)}
                      className={`absolute inset-0 z-20 ${
                        activeTool !== 'select' ? 'cursor-crosshair hover:bg-black/[0.01]' : 'cursor-default'
                      }`}
                    >
                      {/* Drawing Indicator Box */}
                      {isDrawing && drawPageNum === pageNum && drawingBox && (
                        <div
                          style={{
                            left: `${drawingBox.x}%`,
                            top: `${drawingBox.y}%`,
                            width: `${drawingBox.width}%`,
                            height: `${drawingBox.height}%`,
                          }}
                          className={`absolute border border-dashed bg-opacity-5 z-40 pointer-events-none ${
                            activeTool === 'text' ? 'border-blue-500 bg-blue-500' :
                            activeTool === 'checkbox' ? 'border-green-500 bg-green-500' :
                            activeTool === 'image' ? 'border-purple-500 bg-purple-500' :
                            'border-amber-500 bg-amber-500'
                          }`}
                        />
                      )}

                      {/* Render fields placed on this page */}
                      {fields
                        .filter(field => field.page === pageNum)
                        .map(field => {
                          const isSelected = selectedFieldId === field.id
                          
                          let cardBorderColor = 'border-[#0a1628]/40 bg-[#0a1628]/5 hover:border-[#0a1628] dark:border-blue-500/40 dark:bg-blue-500/5 dark:hover:border-blue-400'
                          let cardSelectedColor = 'border-[#0a1628] bg-[#0a1628]/10 ring-2 ring-[#0a1628]/20 shadow-md shadow-[#0a1628]/10 dark:border-blue-400 dark:bg-blue-500/15 dark:ring-blue-400/20'
                          
                          if (field.type === 'checkbox') {
                            cardBorderColor = 'border-green-600/40 bg-green-50/5 hover:border-green-600 dark:border-emerald-500/40 dark:bg-emerald-500/5 dark:hover:border-emerald-400'
                            cardSelectedColor = 'border-green-600 bg-green-50/15 ring-2 ring-green-600/20 shadow-md shadow-green-600/5 dark:border-emerald-400 dark:bg-emerald-500/15 dark:ring-emerald-400/20'
                          } else if (field.type === 'signature') {
                            cardBorderColor = 'border-amber-600/40 bg-amber-50/5 hover:border-amber-600 dark:border-amber-500/40 dark:bg-amber-500/5 dark:hover:border-amber-400'
                            cardSelectedColor = 'border-amber-600 bg-amber-50/15 ring-2 ring-amber-600/20 shadow-md shadow-amber-600/5 dark:border-amber-400 dark:bg-amber-500/15 dark:ring-amber-400/20'
                          } else if (field.type === 'image') {
                            cardBorderColor = 'border-purple-600/40 bg-purple-50/5 hover:border-purple-600 dark:border-purple-500/40 dark:bg-purple-500/5 dark:hover:border-purple-400'
                            cardSelectedColor = 'border-purple-600 bg-purple-50/15 ring-2 ring-purple-600/20 shadow-md shadow-purple-600/5 dark:border-purple-400 dark:bg-purple-500/15 dark:ring-purple-400/20'
                          }

                          return (
                            <div
                              key={field.id}
                              style={{
                                left: `${field.x}%`,
                                top: `${field.y}%`,
                                width: `${field.width}px`,
                                height: `${field.height}px`,
                              }}
                              className={`absolute border rounded flex items-center px-1.5 transition-shadow group ${
                                isSelected ? cardSelectedColor + ' z-30' : cardBorderColor + ' z-20'
                              }`}
                              onMouseDown={(e) => handleFieldDragStart(e, field.id, pageNum)}
                            >
                              {/* Element Visual representation */}
                              <div className="flex items-center justify-between w-full h-full pointer-events-none select-none">
                                {field.type === 'signature' ? (
                                  field.signatureValue ? (
                                    <img 
                                      src={field.signatureValue} 
                                      alt="Signature" 
                                      className="w-full h-full object-contain pointer-events-none" 
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => openSigningPad(field.id)}
                                      className="flex items-center gap-1.5 min-w-0 w-full justify-between pointer-events-auto cursor-pointer h-full"
                                    >
                                      <div className="flex items-center gap-1 min-w-0">
                                        <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        <span className="text-[9px] font-extrabold text-amber-800 dark:text-amber-300 italic truncate">
                                          Click to Sign
                                        </span>
                                      </div>
                                      <span className="text-[8px] font-extrabold text-amber-500 shrink-0 tracking-tighter">SIG</span>
                                    </div>
                                  )
                                ) : field.type === 'image' ? (
                                  field.imageValue ? (
                                    <img 
                                      src={field.imageValue} 
                                      alt="Uploaded Image" 
                                      className="w-full h-full object-cover rounded pointer-events-none"
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => triggerImageSelection(field.id)}
                                      className="flex flex-col items-center justify-center w-full h-full text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-500/10 border border-dashed border-purple-300 dark:border-purple-500/30 rounded pointer-events-auto cursor-pointer p-1"
                                    >
                                      <svg className="w-4 h-4 mb-0.5 text-purple-600 dark:text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                                      </svg>
                                      <span className="text-[8px] font-extrabold tracking-tight uppercase">Upload Image</span>
                                    </div>
                                  )
                                ) : (
                                  <>
                                    <span className={`text-[9px] font-extrabold truncate max-w-[85%] uppercase tracking-tighter ${
                                      field.type === 'checkbox' ? 'text-green-800 dark:text-emerald-300' : 'text-[#0a1628]/80 dark:text-blue-300'
                                    } ${
                                      field.textColor === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                                      field.textColor === 'red' ? 'text-red-700 dark:text-red-400' : ''
                                    }`}>
                                      {field.name}
                                    </span>
                                    
                                    {field.type === 'checkbox' ? (
                                      <div className="w-3.5 h-3.5 border border-green-600/40 dark:border-emerald-500/40 rounded bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <svg className="w-2.5 h-2.5 text-green-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </div>
                                    ) : (
                                      field.required && (
                                        <span className="text-red-500 text-[10px] font-extrabold shrink-0">*</span>
                                      )
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Hidden image input for local file selection */}
                              {field.type === 'image' && (
                                <input
                                  type="file"
                                  id={`image-upload-input-${field.id}`}
                                  accept="image/*"
                                  className="hidden pointer-events-auto"
                                  onChange={(e) => handleImageUpload(e, field.id)}
                                />
                              )}

                              {/* 8-Point Bounding Box Resize Handles (Photoshop style) */}
                              {isSelected && (
                                <>
                                  {/* Corners */}
                                  <div 
                                    className={`absolute -top-1.5 -left-1.5 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-nwse-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'tl')} 
                                  />
                                  <div 
                                    className={`absolute -top-1.5 -right-1.5 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-nesw-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'tr')} 
                                  />
                                  <div 
                                    className={`absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-nesw-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'bl')} 
                                  />
                                  <div 
                                    className={`absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-nwse-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'br')} 
                                  />

                                  {/* Edges */}
                                  <div 
                                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-ns-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 't')} 
                                  />
                                  <div 
                                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-ns-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'b')} 
                                  />
                                  <div 
                                    className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-ew-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'l')} 
                                  />
                                  <div 
                                    className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 border bg-white dark:bg-[#172135] rounded-sm cursor-ew-resize z-40 pointer-events-auto shadow-sm ${
                                      field.type === 'checkbox' ? 'border-green-600 dark:border-emerald-400' :
                                      field.type === 'signature' ? 'border-amber-600 dark:border-amber-400' :
                                      field.type === 'image' ? 'border-purple-600 dark:border-purple-400' : 'border-[#0a1628] dark:border-blue-400'
                                    }`} 
                                    onMouseDown={(e) => handleResizeStart(e, field.id, pageNum, 'r')} 
                                  />
                                </>
                              )}
                            </div>
                          )
                        })}
                    </div>
                    
                    {/* Page Label */}
                    <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 bg-black/60 rounded-lg text-[10px] font-bold text-white tracking-widest uppercase">
                      Page {pageNum}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 3. Right Property Inspector Panel */}
            <div className="w-80 border-l border-slate-200 dark:border-[#243550] bg-white dark:bg-[#0f172a] flex flex-col flex-shrink-0 transition-colors duration-300">
              <div className="p-5 border-b border-slate-200/50 dark:border-[#243550]/50 select-none">
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Property Inspector</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                {selectedField ? (
                  <div className="space-y-5">
                    {/* Element type badge */}
                    <div className="flex items-center gap-2 select-none">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        selectedField.type === 'text' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' 
                          : selectedField.type === 'checkbox'
                          ? 'bg-green-50 text-green-600 dark:text-emerald-400 border border-green-100'
                          : selectedField.type === 'signature'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}>
                        {selectedField.type === 'text' ? 'Text Box' : selectedField.type === 'checkbox' ? 'Checkbox' : selectedField.type === 'signature' ? 'Signature' : 'Image'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Page {selectedField.page}</span>
                    </div>

                    {/* Field Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Field ID (Unique Name)</label>
                      <input
                        type="text"
                        value={selectedField.name}
                        onChange={(e) => updateFieldProperty(selectedField.id, { name: e.target.value.replace(/\s+/g, '_') })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Size and Position Inspector */}
                    <div className="border-t border-slate-100 dark:border-[#243550] pt-4">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-3 select-none">Geometry Layout</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 select-none">X Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={Math.round(selectedField.x * 10) / 10}
                            onChange={(e) => updateFieldProperty(selectedField.id, { x: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-lg text-xs font-bold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 select-none">Y Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={Math.round(selectedField.y * 10) / 10}
                            onChange={(e) => updateFieldProperty(selectedField.id, { y: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-lg text-xs font-bold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 select-none">Width (px)</label>
                          <input
                            type="number"
                            min="10"
                            value={Math.round(selectedField.width)}
                            onChange={(e) => updateFieldProperty(selectedField.id, { width: Math.max(10, parseInt(e.target.value) || 10) })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-lg text-xs font-bold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 select-none">Height (px)</label>
                          <input
                            type="number"
                            min="10"
                            value={Math.round(selectedField.height)}
                            onChange={(e) => updateFieldProperty(selectedField.id, { height: Math.max(10, parseInt(e.target.value) || 10) })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-lg text-xs font-bold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Text field specific settings */}
                    {selectedField.type === 'text' && (
                      <div className="border-t border-slate-100 dark:border-[#243550] pt-4 space-y-4">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 select-none">Text Styles</p>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Placeholder / Tooltip</label>
                          <input
                            type="text"
                            value={selectedField.placeholder}
                            onChange={(e) => updateFieldProperty(selectedField.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Default Value</label>
                          <input
                            type="text"
                            value={selectedField.defaultValue}
                            onChange={(e) => updateFieldProperty(selectedField.id, { defaultValue: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Font size */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Font Size ({selectedField.fontSize}pt)</label>
                          <input
                            type="range"
                            min="8"
                            max="24"
                            value={selectedField.fontSize}
                            onChange={(e) => updateFieldProperty(selectedField.id, { fontSize: parseInt(e.target.value) })}
                            className="w-full accent-[#0a1628] dark:accent-amber-400"
                          />
                        </div>

                        {/* Text Color Buttons */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Text Color</label>
                          <div className="flex gap-2">
                            {(['black', 'blue', 'red'] as const).map(color => (
                              <button
                                key={color}
                                onClick={() => updateFieldProperty(selectedField.id, { textColor: color })}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                  selectedField.textColor === color 
                                    ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ' + (
                                        color === 'black' ? 'ring-black dark:ring-white' : color === 'blue' ? 'ring-blue-600' : 'ring-red-600'
                                      )
                                    : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                                }`}
                                style={{
                                  backgroundColor: color === 'black' ? '#000000' : color === 'blue' ? '#2563eb' : '#dc2626'
                                }}
                                title={color.toUpperCase()}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Text Alignment</label>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                            {(['left', 'center', 'right'] as const).map(align => (
                              <button
                                key={align}
                                onClick={() => updateFieldProperty(selectedField.id, { alignment: align })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  selectedField.alignment === align
                                    ? 'bg-white dark:bg-[#172135] text-[#0a1628] dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-[#243550]'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {align.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Multiline setting */}
                        <div className="flex items-center justify-between pt-2">
                          <label htmlFor="prop-multiline" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            Allow Multi-line wrapping
                          </label>
                          <input
                            type="checkbox"
                            id="prop-multiline"
                            checked={selectedField.multiline}
                            onChange={(e) => updateFieldProperty(selectedField.id, { multiline: e.target.checked })}
                            className="rounded border-slate-300 dark:border-slate-700 text-[#0a1628] dark:text-amber-400 focus:ring-[#0a1628] dark:focus:ring-amber-400 w-4 h-4 accent-[#0a1628] dark:accent-amber-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkbox settings */}
                    {selectedField.type === 'checkbox' && (
                      <div className="border-t border-slate-100 dark:border-[#243550] pt-4">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 select-none">Default State</label>
                        <select
                          value={selectedField.defaultValue}
                          onChange={(e) => updateFieldProperty(selectedField.id, { defaultValue: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#172135] text-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none transition-colors"
                        >
                          <option value="">Unchecked</option>
                          <option value="true">Checked</option>
                        </select>
                      </div>
                    )}

                    {/* Signature settings */}
                    {selectedField.type === 'signature' && (
                      <div className="border-t border-slate-100 dark:border-[#243550] pt-4 space-y-4">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 select-none">Signature Details</p>
                        
                        <button
                          onClick={() => openSigningPad(selectedField.id)}
                          className="w-full py-2 px-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-[#78350f] dark:text-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 text-amber-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          {selectedField.signatureValue ? 'Re-sign Field' : 'Sign This Field'}
                        </button>
                      </div>
                    )}

                    {/* Image settings */}
                    {selectedField.type === 'image' && (
                      <div className="border-t border-slate-100 dark:border-[#243550] pt-4 space-y-4">
                        <p className="text-[10px] font-extrabold uppercase text-purple-500 tracking-wider mb-1 select-none">Image Settings</p>
                        
                        <button
                          onClick={() => triggerImageSelection(selectedField.id)}
                          className="w-full py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-900 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                          </svg>
                          {selectedField.imageValue ? 'Change Image' : 'Select Image'}
                        </button>
                        
                        {selectedField.imageValue && (
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            File: {selectedField.defaultValue || 'Uploaded Image'}
                          </div>
                        )}

                        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-400 text-[10px] leading-normal font-bold">
                          ⚠️ Offline Image uploading is blocked in browser PDF viewers (like Chrome/Safari) for security. Final fillers must open this PDF in Adobe Acrobat Reader to upload their logo.
                        </div>
                      </div>
                    )}

                    {/* General Field Settings */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#243550]">
                      <label htmlFor="prop-required" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Mark field as Required
                      </label>
                      <input
                        type="checkbox"
                        id="prop-required"
                        checked={selectedField.required}
                        onChange={(e) => updateFieldProperty(selectedField.id, { required: e.target.checked })}
                        className="rounded border-slate-300 dark:border-slate-700 text-[#0a1628] dark:text-amber-400 focus:ring-[#0a1628] dark:focus:ring-amber-400 w-4 h-4 accent-[#0a1628] dark:accent-amber-400"
                      />
                    </div>

                    {/* Action Panel Buttons */}
                    <div className="pt-4 border-t border-slate-100 dark:border-[#243550] space-y-2 select-none">
                      <button
                        onClick={() => duplicateField(selectedField.id)}
                        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Duplicate Element
                      </button>

                      <button
                        onClick={() => deleteField(selectedField.id)}
                        className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Delete Element
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed select-none">
                    💡 Select any form element on the page to manually edit layout positions, dimensions, default values, or change typography styles.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Adopt Electronic Signature Modal overlay ── */}
      {isSigningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#172135] max-w-lg w-full rounded-3xl shadow-2xl border border-slate-100 dark:border-[#243550] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#243550]">
              <h3 className="font-extrabold text-[#0a1628] dark:text-white tracking-tight">Adopt Your Signature</h3>
              <button 
                onClick={() => setIsSigningModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 dark:border-[#243550] px-6 bg-slate-50/50 dark:bg-[#0f172a]/50">
              <button
                onClick={() => setSignatureTab('type')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  signatureTab === 'type'
                    ? 'border-[#0a1628] text-[#0a1628] dark:border-amber-400 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Type Signature
              </button>
              <button
                onClick={() => setSignatureTab('draw')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  signatureTab === 'draw'
                    ? 'border-[#0a1628] text-[#0a1628] dark:border-amber-400 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Draw Signature
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {signatureTab === 'type' ? (
                /* ── Type Signature Tab ── */
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Enter Name</label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Type your signature name..."
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-[#243550] bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white rounded-xl text-xs font-bold focus:border-[#0a1628] dark:focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">Choose Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Alex Brush', fontClass: 'font-serif' },
                        { name: 'Caveat', fontClass: 'font-sans' },
                        { name: 'Great Vibes', fontClass: 'font-serif' },
                        { name: 'Pacifico', fontClass: 'font-sans' }
                      ].map(item => (
                        <button
                          key={item.name}
                          onClick={() => setSelectedFont(item.name)}
                          className={`p-4 rounded-2xl border text-center transition-all ${
                            selectedFont === item.name
                              ? 'border-[#0a1628] bg-[#0a1628]/5 dark:border-amber-400 dark:bg-amber-400/5 ring-2 ring-[#0a1628]/15 dark:ring-amber-400/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <p 
                            className="text-2xl text-blue-900 dark:text-amber-300 truncate max-w-full italic px-1"
                            style={{ fontFamily: `"${item.name}", cursive` }}
                          >
                            {typedName || 'Sign Here'}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block uppercase tracking-wider">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Draw Signature Tab ── */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Draw Signature</label>
                    <button
                      onClick={clearSigCanvas}
                      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold hover:underline"
                    >
                      Clear Board
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-[#243550] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
                    <canvas
                      ref={sigCanvasRef}
                      width={448}
                      height={180}
                      onMouseDown={startSigDrawing}
                      onMouseMove={drawSig}
                      onMouseUp={stopSigDrawing}
                      onMouseLeave={stopSigDrawing}
                      onTouchStart={startSigDrawing}
                      onTouchMove={drawSig}
                      onTouchEnd={stopSigDrawing}
                      className="bg-white block cursor-pencil w-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-center leading-relaxed">
                    Use your mouse or touchscreen drawpad to write your manual signature in the box above.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-100 dark:border-[#243550]">
              <button
                onClick={() => setIsSigningModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0a1628] to-[#1a3a6b] hover:from-[#1a3a6b] hover:to-[#0a1628] dark:from-amber-400 dark:to-amber-500 dark:text-[#0a1628] dark:hover:from-amber-500 dark:hover:to-amber-600 transition-all shadow-sm shadow-[#0a1628]/15 dark:shadow-amber-400/15"
              >
                Place Signature
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
