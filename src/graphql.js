// Adds a graphql() helper to GoClient. It POSTs { query, variables } as JSON
// and returns the usual thenable RequestBuilder, so you can chain assertions.
//
//   await go(endpoint).graphql("{ user { id } }").expectStatus(200)
//     .expectJson("data.user.id", 1);
import { GoClient } from "./client.js";

Object.defineProperty(GoClient.prototype, "graphql", {
  value: function graphql(query, variables, options = {}) {
    const path = options.path || "";
    return this.post(path).json({ query, variables: variables || {} });
  },
  writable: true,
  enumerable: false,
  configurable: true,
});
