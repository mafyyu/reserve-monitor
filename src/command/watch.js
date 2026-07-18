import fs from 'node:fs/promises';
import { LESSON_TYPE, getLessonTypeByKey } from '../constants/lessonType.js';

const WATCH_REGISTRATIONS_PATH =
  './data/registrations.json';

export async function loadWatchRegistrations() {
  try {
    const json = await fs.readFile(
      WATCH_REGISTRATIONS_PATH,
      'utf-8',
    );

    return normalizeWatchRegistrations(JSON.parse(json));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createEmptyWatchRegistrations();
    }

    throw error;
  }
}

export async function saveWatchRegistrations(
  watchRegistrations,
) {
  await fs.mkdir('./data', {
    recursive: true,
  });

  await fs.writeFile(
    WATCH_REGISTRATIONS_PATH,
    JSON.stringify(normalizeWatchRegistrations(watchRegistrations), null, 2),
    'utf-8',
  );
}

function createEmptyWatchRegistrations() {
  return {
    userId: null,
    guildId: null,
    channelId: null,
    watches: [],
  };
}

function normalizeWatchRegistrations(watchRegistrations) {
  if (Array.isArray(watchRegistrations)) {
    return {
      ...createEmptyWatchRegistrations(),
      watches: watchRegistrations.map(normalizeWatch),
    };
  }

  return {
    ...createEmptyWatchRegistrations(),
    ...watchRegistrations,
    watches: Array.isArray(watchRegistrations?.watches)
      ? watchRegistrations.watches.map(normalizeWatch)
      : [],
  };
}

function normalizeWatch(watch) {
  return {
    dates: watch.dates,
    lessonTypeKey: watch.lessonTypeKey ?? getLessonTypeKeyById(watch.lessonType),
  };
}

function getLessonTypeKeyById(id) {
  return Object.entries(LESSON_TYPE).find(
    ([, lessonType]) => lessonType.id === id,
  )?.[0] ?? id;
}

export async function registerWatch (interaction) {
  const date1 = interaction.options.getString('date1', true);
  const date2 = interaction.options.getString('date2');
  const date3 = interaction.options.getString('date3');
  const lessonTypeKey = interaction.options.getString('type', true);
  const lessonType = getLessonTypeByKey(lessonTypeKey);

  const rawDates = [date1, date2, date3].filter(
    (date) => date !== null,
  );

  
  const dates = rawDates.map((date) =>
    date.replaceAll('-', ''),
  );

  const invalidDate = dates.find(
    (date) => !/^\d{8}$/.test(date),
  );

  if (invalidDate) {
    await interaction.reply({
      content: '日付は2026-07-30の形式で入力してください',
      ephemeral: true,
    });
    return;
  }

  const watchRegistrations = await loadWatchRegistrations();

  watchRegistrations.watches.push({
    dates,
    lessonTypeKey,
  });
  
  await saveWatchRegistrations(watchRegistrations);
  
  await interaction.reply({
    content:
      `監視登録しました\n` +
      `日付: ${rawDates.join(', ')}\n` +
      `タイプ: ${lessonType.label}`,
    ephemeral: true,
  });
}

export async function clearWatch(interaction) {
  const watchRegistrations = await loadWatchRegistrations();

  watchRegistrations.watches = [];

  await saveWatchRegistrations(watchRegistrations);

  await interaction.reply({
    content: '監視登録をすべて削除しました',
    ephemeral: true,
  });
}
