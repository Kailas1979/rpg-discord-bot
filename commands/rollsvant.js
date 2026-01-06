const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

// 🔥 Usa le variabili ambiente invece di config.json
const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rollsvant')
    .setDescription('Tira 3d10 (svantaggio) e prende i peggiori 2 + attributo + modificatore')
    .addStringOption(option =>
      option
        .setName('input')
        .setDescription('Esempio: riflessi +2')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const input = interaction.options.getString('input').trim();
    const parts = input.split(/\s+/);

    const attributo = parts[0].toLowerCase();
    let modificatore = 0;

    if (parts[1]) {
      modificatore = parseInt(parts[1].replace("+", ""), 10);
      if (isNaN(modificatore)) modificatore = 0;
    }

    // 🔥 Recupero scheda usando API_URL e API_TOKEN
    const discordId = interaction.user.id;
    const url = `${API_URL}?discord_id=${encodeURIComponent(discordId)}&token=${encodeURIComponent(API_TOKEN)}`;

    let json;
    try {
      const res = await fetch(url);
      json = await res.json();
    } catch (err) {
      console.error("Errore API:", err);
      return interaction.editReply("Errore di comunicazione con il sito.");
    }

    if (!json.success) {
      return interaction.editReply(`Errore: ${json.message}`);
    }

    const scheda = json.scheda;

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

    // 🎲 Tiro 3d10
    const d1 = Math.floor(Math.random() * 10) + 1;
    const d2 = Math.floor(Math.random() * 10) + 1;
    const d3 = Math.floor(Math.random() * 10) + 1;

    const dadi = [d1, d2, d3].sort((a, b) => a - b);
    const peggiori2 = dadi[0] + dadi[1];

    const totale = peggiori2 + Number(valoreAttr) + modificatore;

    const embed = new EmbedBuilder()
      .setTitle(`🎲 Roll Svantaggio: ${attributo.toUpperCase()}`)
      .setColor("#d63031")
      .addFields(
        { name: "Dadi tirati", value: `${d1}, ${d2}, ${d3}`, inline: true },
        { name: "Peggiori 2", value: `${dadi[0]} + ${dadi[1]} = **${peggiori2}**`, inline: true },
        { name: "Attributo", value: `${valoreAttr}`, inline: true },
        { name: "Modificatore", value: `${modificatore}`, inline: true },
        { name: "Totale", value: `🎯 **${totale}**`, inline: false }
      )
      .setFooter({ text: interaction.user.username });

    return interaction.editReply({ embeds: [embed] });
  }
};
