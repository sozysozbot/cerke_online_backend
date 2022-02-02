import * as gen from "./codegen/openapi";
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";

export type OpenAPIHandler = {
  [Path in keyof gen.paths]: {
    [Method in keyof gen.paths[Path]]: OperationToHandler<
      Cast<gen.paths[Path][Method], Operation<unknown, unknown>>
    >;
  };
};

export type OperationToHandler<Op extends Operation<unknown, unknown>> = (
  ctx: Ctx<Op>,
) => Promise<
  {
    [Code in keyof Op["responses"]]: {
      json: Get<Get<Op["responses"][Code], "content">, "application/json">;
      code: Code;
    };
  }[keyof Op["responses"]]
>;

export type Operation<ReqBody, Res> = {
  requestBody: ReqBody;
  responses: Res;
};

export type Ctx<Op extends Operation<unknown, unknown>> = {
  headers: Record<string, string | string[] | undefined>;
  requestBody: Get<Get<Op["requestBody"], "content">, "application/json">;
};

type Cast<A, R> = A extends R ? A : R;
type Get<A, K extends keyof any> = Cast<A, Record<K, unknown>>[K];

export function useHandler(
  app: express.Express,
  handler: OpenAPIHandler,
): express.Express {
  app.use(
    OpenApiValidator.middleware({
      apiSpec: "../openapi.yaml",
      validateRequests: true,
      validateResponses: true,
    }),
  );

  for (const [path, methods] of Object.entries(handler)) {
    for (const [method, handler] of Object.entries(methods)) {
      app[method as "get" | "post"](path, async (req, res) => {
        const ctx: Ctx<Get<typeof handler, "operation">> = {
          headers: req.headers,
          requestBody: req.body,
        };
        const result = await handler(ctx);
        res.status(result.code).json(result.json);
      });
    }
  }

  return app;
}
