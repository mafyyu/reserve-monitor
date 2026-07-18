import "dotenv/config";
import { unlink } from "node:fs/promises";
import {
  AttachmentBuilder,
  Client,
  GatewayIntentBits,
} from 'discord.js';
import { LESSON_TYPE_CHOICES } from "./constants/lessonType.js";
import { fetchSchedule } from "./reserveClient.js";
import { clearWatch, registerWatch } from "./command/watch.js";
import { startMonitoring } from './monitor.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 起動時の処理
client.once('clientReady', async (readyClient) => {
  console.log(`${readyClient.user.tag} としてログインしました`);
  const data = [
    {
      name: "ping",
      description: "Replies with Pong!",
    },
    {
      name: "set",
      description: "セット教習の結果を返す"
    },
    {
      name: "practical",
      description: "実車教習の結果を返す"
    },
    {
      name: "multiple",
      description: "複数教習の結果を返す"
    },
    {
      name: "highway",
      description: "高速教習の結果を返す"
    },
    {
      name: "first_aid",
      description: "学応急の結果を返す"
    },
    {
      name: "watch",
      description: "監視する日程を追加します",
      options: [
        {
          name: 'date1',
          description: '監視日1（例: 2026-07-30）',
          type: 3,
          required: true,
        },
        {
          name: 'type',
          description: '教習タイプ',
          type: 3,
          required: true,
          choices: LESSON_TYPE_CHOICES,
        },
        {
          name: 'date2',
          description: '監視日2（例: 2026-07-31）',
          type: 3,
          required: false,
        },
        {
          name: 'date3',
          description: '監視日3（例: 2026-08-01）',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: "clear_watch",
      description: "監視登録をすべて削除します",
    }
  ];
  await client.application.commands.set(data, process.env.DISCORD_SERVER_ID);
  void startMonitoring(readyClient);
});

// メッセージを受け取った時の処理
client.on('messageCreate', message => {
    // Bot自身の発言は無視する
    if (message.author.bot) return;

    // 「こんにちは」と来たら「こんにちは！」と返す
    if (message.content === 'こんにちは') {
        message.channel.send('こんにちは！');
    }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong！');
    return;
  }

  if (interaction.commandName === 'watch') {
    await registerWatch(interaction)
    return;
  }

  if (interaction.commandName === 'clear_watch') {
    await clearWatch(interaction);
    return;
  }
  
  const lessonTypeByCommand = {
    set: "SET",
    practical: "PRACTICAL",
    multiple: "MULTIPLE",
    highway: "HIGHWAY",
    first_aid: "FIRST_AID",
  };
  const lessonTypeKey = lessonTypeByCommand[interaction.commandName];

  if (!lessonTypeKey) {
    return;
  }

  await replySchedule(interaction, lessonTypeKey);
  
});

async function replySchedule(interaction, lessonTypeKey) {
  let screenshotPath;

  await interaction.deferReply();

  try {
    const result = await fetchSchedule(lessonTypeKey);
    screenshotPath = result.screenshotPath;

    const image = new AttachmentBuilder(screenshotPath);
    await interaction.editReply({
      content: '画像です',
      files: [image],
    });

    try {
      await unlink(screenshotPath);
    } catch (deleteError) {
      console.error("Failed to delete screenshot:", deleteError);
    }
  } catch (error) {
    console.error("Schedule command failed:", error);

    await interaction.editReply({
      content: "取得または送信に失敗しました",
    });
  }
}

// 以下にトークンの貼り付け
client.login(process.env.DISCORD_TOKEN);
