import { app, env } from "./app";

app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`);
});
