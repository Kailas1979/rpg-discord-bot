const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Carica i comandi dalla cartella /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, c => {
  console.log(`Bot loggato come ${c.user.tag}`);
});

// Gestione dei comandi slash
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`Esecuzione comando: /${interaction.commandName}`);

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`Comando non trovato: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Errore durante l'esecuzione del comando:", error);

    // Se il comando ha già risposto o deferReply è stato usato
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: 'Si è verificato un errore durante l’esecuzione del comando.'
      });
    } else {
      await interaction.reply({
        content: 'Si è verificato un errore durante l’esecuzione del comando.',
        flags: 64 // sostituisce ephemeral
      });
    }
  }
});

client.login(config.token);
