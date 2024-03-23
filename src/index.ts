import { Hono } from "hono";
import { Ai } from "@cloudflare/ai";

type Bindings = {
  AI: any;
};
const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  c.text("hello world");
});

app.post("/conversation", async (c) => {
  const ai = new Ai(c.env.AI);
  const body = await c.req.json<{
    prompts: { role: string; content: string }[];
  }>();
  const { prompts } = body;
  const messages = [
    {
      role: "system",
      content:
        "You are a friendly assistant, should answer only in markdown code",
    },
  ].concat(prompts);
  const response = await ai.run("@cf/mistral/mistral-7b-instruct-v0.1", {
    messages,
  });
  console.log(response, "sss", prompts);
  return Response.json({ role: "assistant", content: response!.response });
});

app.post("/image", async (c) => {
  const ai = new Ai(c.env.AI);
  const body = await c.req.parseBody();
  const prompt = body["prompt"] as string;
  const image = body["image"] as File;
  let response: Uint8Array;
  if (!image) {
    response = await ai.run("@cf/bytedance/stable-diffusion-xl-lightning", {
      prompt,
    });
  } else {
    response = await ai.run("@cf/runwayml/stable-diffusion-v1-5-img2img", {
      prompt,
      image: [...new Uint8Array(await image.arrayBuffer())],
    });
  }

  return new Response(response, {
    headers: {
      "content-type": "image/png",
    },
  });
});

export default app;
