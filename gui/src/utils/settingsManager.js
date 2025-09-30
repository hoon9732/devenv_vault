async function getSettings() {
  try {
    if (window.electron) {
      return await window.electron.getSettings();
    }
  } catch (error) {
    console.error('Error getting settings:', error);
  }
  // Return a fallback object if electron API is not available
  return { theme: 'dark', language: 'en', scale: 1 };
}

async function saveSettings(settings) {
  try {
    if (window.electron) {
      await window.electron.saveSettings(settings);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

module.exports = { getSettings, saveSettings };
