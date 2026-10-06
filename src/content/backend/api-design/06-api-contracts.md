@part VI | API contracts | We make the API's promise explicit in a machine-readable contract that clients, servers and tests all share. Without one, the documentation, the server and the clients drift apart, and the drift is discovered in production. We will cover OpenAPI and JSON Schema, schema-first development with generated code, and backward compatibility checked by contract tests. | where:6

## 21. OpenAPI, JSON Schema and Swagger

Wren's partner team writes an integration against the docs page, which says `total` is a number. The server actually returns a string for older orders. Nobody wrote that down, and the partner's parser fails on 3% of orders. The documentation, the server and the client each had their own idea of the API. A **contract** is a single, machine-readable description of the API that all three can be checked against.

For HTTP APIs the standard is **OpenAPI**, a YAML or JSON document describing every path, method, parameter, request body, response, status code and authentication scheme. Version 3.1 (2021) uses **JSON Schema**, the standard vocabulary for describing JSON documents, for all data shapes, so `Order` is defined once with its fields, types, formats and required list, and referenced everywhere. OpenAPI began as the Swagger specification, created by Tony Tam in 2011, and was donated to the Linux Foundation in 2015. "Swagger" now usually means the tools around it, such as Swagger UI, which renders interactive documentation from the document.

@fig be_openapi | One document, four consumers. The orange one, validation, keeps the server honest.

The value comes from what the document drives. Reference documentation is generated, so it cannot fall out of date with the contract. Client libraries in several languages are generated, so partners do not hand-write parsers. Request validation middleware rejects bodies that do not match the schema before handler code runs, which is the schema layer from Unit IV for free. Mock servers answer from the examples in the document, so a front-end team can build against an API that does not exist yet.

## 22. Protocol Buffers, generated clients and schema-first development

There are two ways to get a contract. In the code-first way, engineers write handlers with annotations and a tool generates the OpenAPI document from the code. It is quick to start, and the contract describes whatever the code happens to do, including accidents. In the schema-first way, engineers write or change the contract first, review it like code, then generate server stubs and clients from it and implement the stubs. Changes to the API become visible in a small diff of the contract, which reviewers can read, instead of being scattered through handler code.

@fig be_contract_flow | Schema first. The contract changes, a check looks for breaking changes, and code is generated from it.

gRPC is schema-first by design, since the `.proto` file is the only source, and the same applies to GraphQL schemas. For REST, tools such as OpenAPI Generator produce clients for dozens of languages and server stubs for many frameworks. Generated clients are not always pleasant to use, and some companies hand-polish a thin layer over them, but the types and field names in that layer come from the contract.

The most valuable step in the flow is the automatic breaking-change check. A tool compares the proposed contract with the published one and fails the build if a field was removed, a type changed, an optional field became required or an enum value disappeared. `oasdiff` does this for OpenAPI and `buf breaking` for protobuf. The check catches the break in a pull request, where it costs a comment, instead of in a partner's production system, where it costs an incident.

## 23. Backward compatibility and contract tests

A schema diff knows the rules of compatibility, but not who depends on what. Removing an optional field `legacy_ref` is breaking by the rules, yet maybe no client reads it. Changing the format of `eta` from minutes to an ISO timestamp passes the diff if both are strings, yet breaks every client that does arithmetic with it. **Contract tests** check the actual expectations of actual consumers.

In **consumer-driven contract testing**, popularised by the Pact tool, each consumer writes down the interactions it relies on. The mobile app records "when I send `GET /orders/123` with a token, I expect a 200 with `id` as an integer, `status` as a string and `items` as an array". These expectations are published to a shared broker. The provider's CI then replays every consumer's expectations against the real orders service and fails if any are not met. Before removing `legacy_ref`, the provider can check whether any consumer's contract mentions it.

@fig be_contract_tests | Consumers publish what they rely on. The provider's CI verifies every expectation before deploying.

Contract tests sit between unit tests and full end-to-end tests. They are fast because they test one service against recorded expectations rather than spinning up every service, and specific because a failure names the consumer and the field. They work best inside one company, where consumers can be required to publish contracts. For public APIs with unknown consumers, the schema diff, versioning and traffic measurements from Part III do the same job.

:::story Picture this
A landlord who wants to renovate a building. A schema diff is the building code, which says what is allowed in general. Contract tests are asking each tenant to write down what they actually use, the pipe under the kitchen sink, the outlet behind the fridge, before any wall comes down.
:::

:::warn Watch out
A contract that is not enforced is documentation that will drift. Validate real requests and responses against the schema in tests, and in production at least in log-only mode, so differences between the contract and the code show up as alerts instead of as partner bug reports.
:::

:::interview Interview lens
**"How do you make sure an API change doesn't break its consumers?"** Keep a machine-readable contract, OpenAPI for REST or .proto for gRPC, reviewed schema-first, and run an automatic breaking-change diff in CI that blocks removals, type changes and new required fields. For known internal consumers, add consumer-driven contract tests so the provider's CI verifies what each consumer actually relies on. Validate requests and responses against the contract in tests and in production. When a break is needed, version and deprecate as usual.
:::

:::key In one breath
An API contract is one machine-readable description, OpenAPI with JSON Schema for REST or Protocol Buffers for gRPC, from which docs, clients, validation and mocks are generated. Schema-first development makes API changes visible as small reviewed diffs, and an automatic breaking-change check blocks incompatible changes before merge. Consumer-driven contract tests, such as Pact, let each consumer publish the interactions it relies on so the provider can verify them in CI. Contracts that are not enforced against real traffic drift.
:::
