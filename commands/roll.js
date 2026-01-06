const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Tira 2d10 + attributo + modificatore')
    .addStringOption(option =>
      option
        .setName('input')
        .setDescription('Esempio: riflessi +2')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const input = interaction.options.getString('input').trim();

    // ============================
    // PARSING INPUT
    // ============================
    const parts = input.split(/\s+/);

    const attributo = parts[0].toLowerCase();
    let modificatore = 0;

    if (parts[1]) {
      modificatore = parseInt(parts[1].replace("+", ""), 10);
      if (isNaN(modificatore)) modificatore = 0;
    }

    // ============================
    // RECUPERO SCHEDA
    // ============================
    const discordId = interaction.user.id;
    const url = `${config.api_url}?discord_id=${encodeURIComponent(discordId)}&token=${encodeURIComponent(config.api_token)}`;

    let json;
    try {
      const res = await fetch(url);
      json = await res.json();
    } catch (err) {
      console.error("Errore chiamando API WordPress:", err);
      return interaction.editReply("Errore di comunicazione con il sito.");
    }

    if (!json.success) {
      return interaction.editReply(`Errore: ${json.message}`);
    }

    const scheda = json.scheda;

    // ============================
    // ATTRIBUTI DISPONIBILI
    // ============================
    const attivi = scheda.attributi_attivi || {};
    const passivi = scheda.attributi_passivi || {};

    const valoreAttr =
      attivi[attributo] ??
      passivi[attributo] ??
      null;

    if (valoreAttr === null) {
      return interaction.editReply(
        `Attributo **${attributo}** non trovato.\n` +
        `Attributi disponibili: tempra, volonta, riflessi, ragione, percezione, freddezza, violenza, carisma, spirito`
      );
    }

    // ============================
    // Tiro 2d10
    // ============================
    const d1 = Math.floor(Math.random() * 10) + 1;
    const d2 = Math.floor(Math.random() * 10) + 1;
    const sommaDadi = d1 + d2;

    const totale = sommaDadi + Number(valoreAttr) + modificatore;

    // ============================
    // EMBED RISULTATO
    // ============================
    const embed = new EmbedBuilder()
      .setTitle(`🎲 Roll: ${attributo.toUpperCase()}`)
      .setColor("#00b894")
      .addFields(
        { name: "Dadi", value: `${d1} + ${d2} = **${sommaDadi}**`, inline: true },
        { name: "Attributo", value: `${valoreAttr}`, inline: true },
        { name: "Modificatore", value: `${modificatore}`, inline: true },
        { name: "Totale", value: `🎯 **${totale}**`, inline: false }
      )
      .setFooter({ text: interaction.user.username });

    return interaction.editReply({ embeds: [embed] });
  }
};
