const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
let user,sub,records,notifications,tail;function reset(tier='FREE',subscription=null){user={tier};sub=subscription;records=new Map();notifications=[];tail=Promise.resolve();}
const tx={
 $executeRaw:async()=>{},
 academyAuditLog:{findUnique:async({where})=>records.get(where.id)||null,create:async({data})=>{assert(!records.has(data.id));records.set(data.id,{...data});return data;},update:async({where,data})=>Object.assign(records.get(where.id),data)},
 user:{findUniqueOrThrow:async()=>({...user}),update:async({data})=>Object.assign(user,data)},
 subscription:{findUnique:async()=>sub},notification:{create:async({data})=>notifications.push(data)}
};
const prisma={...tx,$transaction:fn=>{const result=tail.then(()=>fn(tx));tail=result.catch(()=>{});return result;}};
const mod={exports:{}};const source=ts.transpileModule(fs.readFileSync('lib/academy-membership-bonus.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInThisContext('(function(require,module,exports){'+source+'})')(id=>id==='@/lib/prisma'?{prisma}:require(id),mod,mod.exports);
const {grantAcademyMembershipBonus:grant,reconcileAcademyMembershipBonus:reconcile,addTwoMonths,isAcademyPurchase}=mod.exports;
const purchase=(kind='course',id='cs_test_1',userId='buyer')=>({id,mode:'payment',payment_status:'paid',metadata:{userId,type:kind,productKey:kind+':credits-filing-status'}});
let checks=0;const check=fn=>{fn();checks++;};
(async()=>{
 for(const id of ['30-day-tax-office','due-diligence-course','irs-fine-defense','schedule-c-reconstruction','audit-playbook','credits-filing-status','ultimate-bundle','ultimate-bundle-plus'])check(()=>assert.equal(isAcademyPurchase({...purchase(),metadata:{userId:'buyer',type:id.startsWith('ultimate')?'bundle':'toolkit',toolkitId:id}}),true));
 for(const kind of ['course','toolkit','bundle']){reset();const result=await grant(purchase(kind),'buyer',new Date('2026-01-31T12:00:00Z'));check(()=>assert.equal(result.expiresAt,'2026-03-31T12:00:00.000Z'));check(()=>assert.equal(user.tier,'MARKETPLACE_PLUS'));check(()=>assert.equal(notifications.length,1));check(()=>assert.equal(sub,null));}
 reset();const results=await Promise.all(Array.from({length:10},(_,i)=>grant(purchase('bundle','cs_'+i),'buyer',new Date('2026-01-01Z'))));check(()=>assert.equal(results.filter(r=>r.granted).length,1));check(()=>assert.equal(notifications.length,1));check(()=>assert.equal(records.size,1));
 await reconcile('buyer',new Date('2026-03-02Z'));check(()=>assert.equal(user.tier,'FREE'));check(()=>assert.equal(notifications.length,2));await reconcile('buyer',new Date('2026-03-03Z'));check(()=>assert.equal(notifications.length,2));const repeat=await grant(purchase('course','cs_later'),'buyer',new Date('2026-04-01Z'));check(()=>assert.equal(repeat.granted,false));check(()=>assert.equal(user.tier,'FREE'));
 for(const tier of ['VIP','MARKETPLACE','MARKETPLACE_PLUS']){reset(tier,{plan:tier,status:'active',stripeSubscriptionId:'sub_paid',currentPeriodEnd:new Date('2027-01-01Z')});const original=JSON.stringify(sub);await grant(purchase(),'buyer',new Date('2026-01-01Z'));check(()=>assert.equal(JSON.stringify(sub),original));await reconcile('buyer',new Date('2026-03-02Z'));check(()=>assert.equal(user.tier,tier));}
 reset('VIP',{plan:'VIP',status:'active'});await grant(purchase(),'buyer',new Date('2026-01-01Z'));sub={plan:'FREE',status:'canceled'};user.tier='FREE';await reconcile('buyer',new Date('2026-02-01Z'));check(()=>assert.equal(user.tier,'MARKETPLACE_PLUS'));await reconcile('buyer',new Date('2026-03-02Z'));check(()=>assert.equal(user.tier,'FREE'));
 reset();check(()=>assert.equal(isAcademyPurchase({...purchase(),payment_status:'unpaid'}),false));check(()=>assert.equal(isAcademyPurchase({...purchase(),mode:'subscription'}),false));check(()=>assert.equal(isAcademyPurchase({...purchase(),metadata:{userId:'buyer',type:'marketplace'}}),false));const denied=await grant(purchase(),'other');check(()=>assert.equal(denied,null));check(()=>assert.equal(records.size,0));
 check(()=>assert.equal(addTwoMonths(new Date('2026-12-31T12:00:00Z')).toISOString(),'2027-02-28T12:00:00.000Z'));
 check(()=>assert.equal(addTwoMonths(new Date('2023-12-31T12:00:00Z')).toISOString(),'2024-02-29T12:00:00.000Z'));
 console.log('PASS: '+checks+' membership bonus assertions. No live database, payments, or notifications used.');
})().catch(e=>{console.error(e);process.exitCode=1});
