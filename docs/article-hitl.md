# Article-level HITL workflow

This MVP implements human-in-the-loop changes for **articles inside laws that already exist in the database**.

## User flow

1. A registered user opens `/suggestions`.
2. The user chooses an existing law and either:
   - proposes an edit to an existing article, or
   - proposes a new article.
3. The suggestion is stored as `PENDING` in `law_suggestions`.
4. The user can see their suggestion history and the final state.

## Admin flow

1. An administrator opens `/admin/suggestions`.
2. Pending article suggestions can be approved or rejected.
3. Approval generates the `bge-m3` / 1024-dimensional embedding **before** changing the article.
4. The article mutation, vector upsert, audit record, and suggestion state transition to `APPLIED` occur in one PostgreSQL transaction.
5. Rejection records the reason in `admin_note` and creates an audit record.

## Direct admin article editing

The existing article editor under `/admin/laws/:id` now follows the same embedding rule: saving an existing article regenerates only that article's embedding. Adding an article creates one new chunk and one new embedding.

## Failure behavior

If embedding generation fails, no article/database mutation is attempted and the suggestion is marked `FAILED`. If the database transaction fails, the article and embedding changes roll back together; the suggestion is then marked `FAILED` with the error message.

## Security

Server actions perform their own authentication/RBAC checks. Public signup always creates `USER`; a submitted form field cannot create an administrator account.

## Scope boundary

This workflow intentionally does **not** implement user creation of new laws. Existing law metadata and full-law ingestion remain separate admin/ingestion concerns.

## Canonical corpus note

HITL edits are applied to the runtime PostgreSQL corpus and vector index. They are not automatically written back into `data/canonical`. A future corpus-revision/versioning step should reconcile approved HITL changes with canonical JSON before a full reindex, otherwise a later reindex from an older canonical snapshot could overwrite the runtime edit.
