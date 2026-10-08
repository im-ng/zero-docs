# Supabase

`zero` reaches **Supabase** two ways, both reusing existing backends:

- **Database** — Supabase is managed Postgres. Use the `supabase` SQL dialect and `zero` talks to it through the normal `ctx.SQL` handle.
- **Storage** — Supabase object storage is S3-compatible. Use the `supabase` file-store backend and the same `ctx.FileStore` handle.

## Database

```bash [configs/.env]
DB_DIALECT=supabase
SUPABASE_DB_PROJECT=abcdefghijklmno               # -> db.<ref>.supabase.co (use this or HOST)
SUPABASE_DB_HOST=db.abcdefghijklmno.supabase.co    # alternatively, set HOST directly
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=
SUPABASE_DB_NAME=postgres
SUPABASE_DB_SSL_MODE=require
```

Everything you can do with Postgres works — migrations, `ctx.SQL` queries, Auto CRUD. See [Using Postgres](/rest-handler).

## Storage

```bash [configs/.env]
FILE_STORE_BACKEND=supabase
SUPABASE_STORAGE_BUCKET=my-bucket
SUPABASE_STORAGE_ACCESS_KEY=       # the "S3 Access Key" from Supabase Storage, NOT a JWT
SUPABASE_STORAGE_SECRET_KEY=
SUPABASE_STORAGE_REGION=us-east-1  # required for the SigV4 scope
SUPABASE_STORAGE_PROJECT=abcdefghijklmno   # -> https://<ref>.supabase.co/storage/v1/s3
```

`ctx.FileStore` is unchanged — `create` / `get` / `delete` / `list` all work. See [File Store](/file-store).

## Caveats

- Storage auth uses the S3 Access Keys from Supabase Storage settings, not JWTs.
- `SUPABASE_STORAGE_REGION` is required because SigV4 signs against a region.

See the [zero-filestore](https://github.com/im-ng/zero/tree/experimental/examples/zero-filestore) example.
