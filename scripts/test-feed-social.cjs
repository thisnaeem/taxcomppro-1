// Run: node scripts/test-feed-social.cjs
// Optional database checks use a rolled-back transaction: add --database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const social = load('lib/feed-social.ts');
const catalog = load('lib/specialists/catalog.ts');
let session = null;
const follows = new Map(), posts = new Map();
const publicPost = { id: 'original', authorId: 'author', content: 'Original content', scheduledAt: null, communityId: null, community: null, isRepost: false };
posts.set(publicPost.id, publicPost);
const db = {
  user: { findUnique: async ({ where }) => where.id === 'missing' ? null : { id: where.id } },
  userFollow: {
    findUnique: async ({ where }) => follows.get(JSON.stringify(where.followerId_followingId)) || null,
    upsert: async ({ create }) => { follows.set(JSON.stringify(create), create); return create; },
    count: async ({ where }) => [...follows.values()].filter(x => x.followingId === where.followingId).length,
    deleteMany: async ({ where }) => { follows.delete(JSON.stringify(where)); return { count: 1 }; },
  },
  post: {
    findUnique: async ({ where }) => posts.get(where.id) || null,
    upsert: async ({ create }) => {
      const existing = [...posts.values()].find(p => p.authorId === create.authorId && p.originalPostId === create.originalPostId);
      if (existing) return existing;
      const result = { id: `repost-${posts.size}`, ...create, scheduledAt: null, communityId: null, community: null };
      posts.set(result.id, result); return result;
    },
    deleteMany: async ({ where }) => {
      for (const [id, post] of posts) if (post.authorId === where.authorId && post.originalPostId === where.originalPostId && post.isRepost) posts.delete(id);
      return { count: 1 };
    },
  },
  $transaction: fn => fn(db),
};
const mocks = { '@/lib/prisma': { prisma: db }, '@/lib/auth': { auth: { api: { getSession: async () => session } } }, '@/lib/feed-social': social, '@/lib/specialists/catalog': catalog };
const follow = load('app/api/users/[id]/follow/route.ts', mocks);
const repost = load('app/api/feed/[postId]/repost/route.ts', mocks);
const req = (method = 'POST', content = '') => new Request('http://localhost/api/test', { method, ...(method === 'POST' ? { body: JSON.stringify({ content }), headers: { 'Content-Type': 'application/json' } } : {}) });
const target = id => ({ params: Promise.resolve({ id }) });
const original = id => ({ params: Promise.resolve({ postId: id }) });

(async () => {
  assert.equal((await follow.POST(req(), target('author'))).status, 401);
  assert.equal((await repost.POST(req(), original('original'))).status, 401);
  session = { user: { id: 'viewer' } };
  assert.equal((await follow.POST(req(), target('viewer'))).status, 400);
  assert.equal((await follow.POST(req(), target('missing'))).status, 404);
  await Promise.all([follow.POST(req(), target('author')), follow.POST(req(), target('author'))]);
  assert.equal(follows.size, 1);
  assert.deepEqual(await (await follow.GET(req('GET'), target('author'))).json(), { following: true, followerCount: 1 });
  await follow.DELETE(req('DELETE'), target('author'));
  await follow.DELETE(req('DELETE'), target('author'));
  assert.equal(follows.size, 0);
  const pair = await Promise.all([repost.POST(req(), original('original')), repost.POST(req(), original('original'))]);
  const [a, b] = await Promise.all(pair.map(r => r.json()));
  assert.equal(a.id, b.id);
  assert.equal(posts.size, 2);
  session = { user: { id: 'other' } };
  const second = await (await repost.POST(req('POST', 'My thoughts'), original(a.id))).json();
  assert.equal(posts.get(second.id).originalPostId, 'original');
  await repost.DELETE(req('DELETE'), original('original'));
  assert(posts.has(a.id)); assert(!posts.has(second.id)); assert(posts.has('original'));
  session = { user: { id: 'viewer' } };
  posts.set('private', { ...publicPost, id: 'private', communityId: 'g', community: { isPublic: false } });
  posts.set('scheduled', { ...publicPost, id: 'scheduled', scheduledAt: new Date() });
  posts.set('removed', { ...publicPost, id: 'removed', isRepost: true, originalPostId: null });
  for (const id of ['private', 'scheduled', 'removed', 'unknown']) assert.equal((await repost.POST(req(), original(id))).status, 403);
  assert.equal((await repost.POST(req('POST', 'x'.repeat(3001)), original('original'))).status, 400);
  assert.equal((await repost.POST(req('POST', 'SSN 123-45-6789'), original('original'))).status, 400);
  assert.equal(social.canRepost(posts.get('private')), false);
  assert.equal(social.canRepost({ ...publicPost, communityId: 'g', community: { isPublic: true } }), true);
  await repost.DELETE(req('DELETE'), original('original'));
  assert(!posts.has(a.id)); assert(posts.has('original'));
  console.log('PASS: authentication, self-follow rejection, follow/unfollow idempotency, concurrent repost deduplication, original attribution, own-repost removal, private/scheduled/deleted originals, input validation.');

  if (process.argv.includes('--database')) {
    const { prisma } = load('lib/prisma.ts');
    const rollback = new Error('ROLLBACK_TEST_FIXTURES');
    try {
      await prisma.$transaction(async tx => {
        const prefix = `social-test-${Date.now()}`;
        const ids = ['viewer', 'outgoing', 'incoming', 'followed', 'pending'].map(n => `${prefix}-${n}`);
        for (const id of ids) await tx.user.create({ data: { id, email: `${id}@example.invalid`, name: 'Social test fixture', specialties: [], certifications: [], languages: [], mediaPhotos: [] } });
        const [viewer, outgoing, incoming, followed, pending] = ids;
        await tx.connection.createMany({ data: [
          { requesterId: viewer, receiverId: outgoing, status: 'ACCEPTED' },
          { requesterId: incoming, receiverId: viewer, status: 'ACCEPTED' },
          { requesterId: viewer, receiverId: pending, status: 'PENDING' },
        ] });
        await tx.userFollow.create({ data: { followerId: viewer, followingId: followed } });
        for (const authorId of ids) await tx.post.create({ data: { authorId, content: prefix, images: [] } });
        const connections = await tx.post.findMany({ where: { content: prefix, ...social.feedAuthorFilter('connections', viewer) }, select: { authorId: true } });
        assert.deepEqual(connections.map(p => p.authorId).sort(), [outgoing, incoming].sort());
        const following = await tx.post.findMany({ where: { content: prefix, ...social.feedAuthorFilter('following', viewer) }, select: { authorId: true } });
        assert.deepEqual(following.map(p => p.authorId), [followed]);
        const source = await tx.post.findFirstOrThrow({ where: { content: prefix, authorId: followed } });
        const wrapper = await tx.post.create({ data: { authorId: viewer, originalPostId: source.id, isRepost: true, content: '', images: [] } });
        await tx.post.delete({ where: { id: source.id } });
        const tombstone = await tx.post.findUniqueOrThrow({ where: { id: wrapper.id } });
        assert.equal(tombstone.originalPostId, null); assert.equal(tombstone.isRepost, true);
        throw rollback;
      }, { timeout: 30000 });
    } catch (e) { if (e !== rollback) throw e; }
    finally { await prisma.$disconnect(); }
    console.log('PASS: real database filters include accepted connections in both directions, exclude pending requests, isolate followed authors, and preserve unavailable-original reposts. All database fixtures rolled back.');
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
