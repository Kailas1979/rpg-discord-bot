const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

// 🔥 Usa le variabili ambiente invece di config.json
const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scheda')
    .setDescription('Mostra la tua scheda personaggio'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const discordId = interaction.user.id;

    // 🔥 Costruzione URL API usando variabili ambiente
    const url = `${API_URL}?discord_id=${encodeURIComponent(discordId)}&token=${encodeURIComponent(API_TOKEN)}`;

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

    const scheda = json.scheda || {};
    const abilita = json.abilita_acquistate || [];

    const safe = (v) => {
      if (v === null || v === undefined) return "N/D";
      if (typeof v === "object") {
        return Object.entries(v)
          .map(([k, val]) => `${k}: ${val}`)
          .join("\n");
      }
      return String(v);
    };

    const feriteReadable = Object.entries(scheda.ferite || {})
      .filter(([k, v]) => v === true)
      .map(([k]) => k.replace(/_/g, " "))
      .join(", ") || "Sano";

    const stabilitaReadable = Object.entries(scheda.stabilita || {})
      .filter(([k, v]) => v === true)
      .map(([k]) => k.replace(/_/g, " "))
      .join(", ") || "Calmo";

    const embedScheda = new EmbedBuilder()
      .setTitle(`📄 Scheda di ${safe(scheda.nome_personaggio)}`)
      .setColor("#2b8cff")
      .addFields(
        { name: "👤 Giocatore", value: safe(scheda.nome_giocatore), inline: true },
        { name: "🏴‍☠️ Ciurma", value: safe(scheda.ciurma), inline: true },
        { name: "\u200B", value: "\u200B" },
        { name: "⭐ Avanzamento", value: safe(scheda.avanzamento), inline: false },
        { name: "📊 Attributi Passivi", value: safe(scheda.attributi_passivi), inline: true },
        { name: "⚔️ Attributi Attivi", value: safe(scheda.attributi_attivi), inline: true },
        { name: "\u200B", value: "\u200B" },
        { name: "❤️ Ferite", value: feriteReadable, inline: true },
        { name: "🧠 Stabilità", value: stabilitaReadable, inline: true }
      );

    const embedAbilita = new EmbedBuilder()
      .setTitle(`✨ Abilità Acquistate`)
      .setColor("#ffb32b");

    if (abilita.length === 0) {
      embedAbilita.setDescription("Nessuna abilità acquistata.");
    } else {
      embedAbilita.setDescription(
        abilita
          .map(a =>
            `**${safe(a.nome)}** — *${safe(a.categoria)}*\n${safe(a.descrizione)}\nCosto: ${safe(a.costo)}\n`
          )
          .join("\n")
      );
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('scheda_page')
        .setLabel('Scheda')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('abilita_page')
        .setLabel('Abilità')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('chiudi')
        .setLabel('Chiudi')
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.editReply({
      embeds: [embedScheda],
      components: [buttons]
    });

    const collector = message.createMessageComponentCollector({
      time: 5 * 60 * 1000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "Non puoi usare i bottoni della scheda di un altro utente.",
          flags: 64
        });
      }

      if (i.customId === 'scheda_page') {
        await i.update({ embeds: [embedScheda], components: [buttons] });
      }

      if (i.customId === 'abilita_page') {
        await i.update({ embeds: [embedAbilita], components: [buttons] });
      }

      if (i.customId === 'chiudi') {
        collector.stop();
        await i.update({ content: "Scheda chiusa.", embeds: [], components: [] });
      }
    });

    collector.on('end', async () => {
      try {
        await message.edit({ components: [] });
      } catch (e) {}
    });
  }
};
