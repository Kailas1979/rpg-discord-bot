const { SlashCommandBuilder } = require('discord.js');

// 🔥 Usa variabili ambiente invece di config.json
const API_URL_COLLEGA = process.env.API_URL_COLLEGA;
const API_TOKEN = process.env.API_TOKEN;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collega')
    .setDescription('Collega il tuo account Discord al tuo account sul sito')
    .addStringOption(option =>
      option.setName('email')
        .setDescription('L’email con cui sei registrato sul sito')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const email = interaction.options.getString('email');
    const discordId = interaction.user.id;

    // 🔥 Costruzione URL API usando variabili ambiente
    const url = `${API_URL_COLLEGA}?email=${encodeURIComponent(email)}&discord_id=${encodeURIComponent(discordId)}&token=${encodeURIComponent(API_TOKEN)}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) {
        return interaction.editReply({ content: `Errore: ${json.message}`, flags: 64 });
      }

      return interaction.editReply({ content: `Perfetto! Il tuo account Discord è stato collegato a **${email}**.`, flags: 64 });

    } catch (error) {
      console.error("Errore chiamando API WordPress:", error);
      return interaction.editReply({ content: "Errore di comunicazione con il sito.", flags: 64 });
    }
  }
};
