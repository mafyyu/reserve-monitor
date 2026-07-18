// src/monitor.js

import { loadWatchRegistrations } from './command/watch.js';
import { getLessonTypeByKey } from './constants/lessonType.js';
import { fetchSchedule } from './reserveClient.js';

const CHECK_INTERVAL_MS = 3 * 60 * 60 * 1000;

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function formatSlot(slot) {
  const year = slot.id.slice(0, 4);
  const month = slot.id.slice(4, 6);
  const day = slot.id.slice(6, 8);

  return `${year}/${month}/${day} ${slot.period}限`;
}

async function sendNotification(
  client,
  userId,
  channelId,
  lessonType,
  slots,
) {
  const channel = await client.channels.fetch(channelId);

  if (!channel?.isTextBased()) {
    throw new Error(
      `通知先チャンネルが見つかりません: ${channelId}`,
    );
  }

  const slotText = slots
    .map((slot) => formatSlot(slot))
    .join('\n');

  await channel.send({
    content:
      `<@${userId}>\n` +
      `${lessonType.label}教習に空きがあります！\n` +
      slotText,
    allowedMentions: {
      users: [userId],
    },
  });
}

async function checkLessonType(
  client,
  registration,
  lessonTypeKey,
) {
  const lessonType =
    getLessonTypeByKey(lessonTypeKey);

  console.log(
    `${lessonType.label}の空き状況を確認中`,
  );

  const result = await fetchSchedule(
    lessonTypeKey,
    { screenshot: false },
  );
  const availableSlots = result.availableSlots;

  if (availableSlots.length === 0) {
    console.log(
      `${lessonType.label}に空きはありません`,
    );

    return;
  }

  // 同じ教習タイプを監視している設定
  const targetWatches =
    registration.watches.filter(
      (watch) =>
        watch.lessonTypeKey === lessonTypeKey,
    );

  for (const watch of targetWatches) {
    // 登録された日付に一致する空きだけ取得
    const matchedSlots =
      availableSlots.filter((slot) =>
        watch.dates.some((date) =>
          slot.id.startsWith(date),
        ),
      );

    if (matchedSlots.length === 0) {
      continue;
    }

    await sendNotification(
      client,
      registration.userId,
      registration.channelId,
      lessonType,
      matchedSlots,
    );
  }
}

async function checkAllWatches(client) {
  const registration =
    await loadWatchRegistrations();

  if (!registration) {
    console.log('監視登録データがありません');
    return;
  }

  if (
    !Array.isArray(registration.watches) ||
    registration.watches.length === 0
  ) {
    console.log('監視登録はありません');
    return;
  }

  if (!registration.userId) {
    console.error('userIdが登録されていません');
    return;
  }

  if (!registration.channelId) {
    console.error('channelIdが登録されていません');
    return;
  }

  // 同じタイプを何度も取得しないように重複除去
  const lessonTypeKeys = [
    ...new Set(
      registration.watches
        .map((watch) => watch.lessonTypeKey)
        .filter(Boolean),
    ),
  ];

  for (const lessonTypeKey of lessonTypeKeys) {
    try {
      await checkLessonType(
        client,
        registration,
        lessonTypeKey,
      );
    } catch (error) {
      console.error(
        `${lessonTypeKey}の監視に失敗しました`,
        error,
      );
    }
  }
}

export async function startMonitoring(client) {
  while (true) {
    try {
      console.log('空き状況を確認します');

      await checkAllWatches(client);
    } catch (error) {
      console.error(
        '監視処理でエラーが発生しました',
        error,
      );
    }

    console.log('3時間後に再確認します');

    await sleep(CHECK_INTERVAL_MS);
  }
}
