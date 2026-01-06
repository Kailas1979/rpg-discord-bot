const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

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

    const url = `${config.api_url_collega}?email=${encodeURIComponent(email)}&discord_id=${encodeURIComponent(discordId)}&token=${encodeURIComponent(config.api_token)}`;

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
