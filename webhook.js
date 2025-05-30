import { Client, middleware } from '@line/bot-sdk';
import OpenAI from 'openai';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 這裡可以加 middleware 驗證 LINE 請求簽章，簡化示範略過
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      try {
        const gptResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: event.message.text }],
        });

        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: gptResponse.choices[0].message.content,
        });
      } catch (error) {
        console.error('OpenAI API Error:', error);
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '抱歉，系統發生錯誤，請稍後再試。',
        });
      }
    }
  }

  res.status(200).send('OK');
}
