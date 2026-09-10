# GraphQL

`zero` ships a schema-less **GraphQL-over-HTTP** engine. You describe your
schema as plain Zig structs: constant fields are returned as-is, and
`*const fn (*Context, Args) anyerror!T` fields are invoked as resolvers (the
`Args` struct is populated from the GraphQL arguments).

See [`examples/zero-graphql`](https://github.com/im-ng/zero/tree/experimental/examples/zero-graphql)
for a runnable example.

## Query root

```zig [src/main.zig]
const std = @import("std");
const zero = @import("zero");

const App = zero.App;
const Context = zero.Context;
const utils = zero.utils;

const User = struct { id: i64, name: []const u8, email: ?[]const u8 };

// Constant fields are returned as-is; function fields are resolvers.
const Query = struct {
    users: *const fn (*Context, void) anyerror![]User,
    user: *const fn (*Context, struct { id: i64 }) anyerror!?User,
};

fn usersResolver(ctx: *Context, _: void) anyerror![]User {
    return try ctx.SQL.queryRows(ctx, User, "SELECT id, name, email FROM users ORDER BY id", .{});
}

fn userResolver(ctx: *Context, args: struct { id: i64 }) anyerror!?User {
    return try ctx.SQL.queryRow(ctx, User, "SELECT id, name, email FROM users WHERE id = $1", .{args.id});
}

var query_root = Query{ .users = usersResolver, .user = userResolver };

pub fn main(init: std.process.Init) !void {
    utils.setIo(init.io);
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const allocator = gpa.allocator();
    const app = try App.new(allocator, init.environ_map);

    // Register the endpoint. Mutation is optional (pass `null`).
    try app.graphql("/graphql", Query, null, &query_root, null);
    try app.run();
}
```

## Mutations

Pass a `Mutation` type (and its root) as the 3rd/5th arguments:

```zig [src/main.zig]
const Mutation = struct {
    createUser: *const fn (*Context, struct { name: []const u8, email: ?[]const u8 }) anyerror!User,
};

fn createUserResolver(ctx: *Context, args: struct { name: []const u8, email: ?[]const u8 }) anyerror!User {
    return (try ctx.SQL.queryRow(ctx, User,
        \\INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email
    , .{ args.name, args.email })).?;
}

var mutation_root = Mutation{ .createUser = createUserResolver };

// ... inside main()
try app.graphql("/graphql", Query, Mutation, &query_root, &mutation_root);
```

## Transport

- `POST /graphql` with `{"query": "..."}` and optional `variables` / `operationName`
- `GET  /graphql?query=...&variables=...&operationName=...` (URL-encoded)

The engine resolves nested objects, lists, arguments, inline/fragment spreads,
and collects per-field errors into `errors` while still returning the partial
`data` payload.

```bash [query]
curl -X POST http://localhost:8080/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ users { id name email } }"}'

curl -X POST http://localhost:8080/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"mutation { createUser(name:\"Bob\", email:\"bob@x.com\") { id name email } }"}'
```
