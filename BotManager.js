const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const Console = require('./ConsoleUtils');

class BotManager {
  constructor() {
    this.client = null;
    this.maintenanceMode = false;
    this.connectedClients = new Map(); // Map para rastrear clientes conectados
    this.kickedClients = new Map(); // Map para rastrear clientes expulsos (ban temporário)
  }

  async initialize() {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
        ]
      });

      this.client.once('clientReady', () => {
        Console.log('Bot', `Bot Discord conectado como ${this.client.user.tag}`);
      });

      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        await this.handleCommand(interaction);
      });

      await this.client.login(process.env.DISCORD_TOKEN);
      await this.registerCommands();
    } catch (error) {
      Console.error('Bot', `Erro ao inicializar bot: ${error.message}`);
    }
  }

  async registerCommands() {
    const commands = [
      {
        name: 'manutencao',
        description: 'Ativa/desativa o modo de manutenção do servidor',
      },
      {
        name: 'kick',
        description: 'Expulsa um jogador do servidor',
        options: [
          {
            name: 'userid',
            description: 'ID do usuário (StumbleId ou DeviceId)',
            type: 3, // STRING
            required: true,
          }
        ]
      },
      {
        name: 'nickname',
        description: 'Altera o nickname de um jogador',
        options: [
          {
            name: 'novo_nick',
            description: 'Novo nickname para o jogador',
            type: 3, // STRING
            required: true,
          },
          {
            name: 'userid',
            description: 'ID do usuário (StumbleId ou DeviceId)',
            type: 3, // STRING
            required: true,
          }
        ]
      },
      {
        name: 'w',
        description: 'Adiciona um sufixo [W] colorido permanente ao username',
        options: [
          {
            name: 'userid',
            description: 'ID do usuário (StumbleId ou DeviceId)',
            type: 3, // STRING
            required: true,
          },
          {
            name: 'hex',
            description: 'Cor em hexadecimal (ex: 36f700, ff0000, 00ff00)',
            type: 3, // STRING
            required: true,
          }
        ]
      },
      {
        name: 'removew',
        description: 'Remove o sufixo [W] do username',
        options: [
          {
            name: 'userid',
            description: 'ID do usuário (StumbleId ou DeviceId)',
            type: 3, // STRING
            required: true,
          }
        ]
      },
      {
        name: 'torneiocriar',
        description: 'Cria um novo torneio',
        options: [
          {
            name: 'nome',
            description: 'Nome do torneio',
            type: 3,
            required: true,
          },
          {
            name: 'estilo',
            description: 'Estilo do torneio (ex: 1v1, 2v2)',
            type: 3,
            required: true,
          },
          {
            name: 'emojis',
            description: 'Emojis permitidos (ex: so soco, todos)',
            type: 3,
            required: true,
          },
          {
            name: 'mapa',
            description: 'Mapa do torneio (ex: level19)',
            type: 3,
            required: true,
          },
          {
            name: 'vagas',
            description: 'Número de vagas (padrão: 4)',
            type: 4, // INTEGER
            required: false,
          },
          {
            name: 'rounds',
            description: 'Número de rounds (padrão: 2)',
            type: 4, // INTEGER
            required: false,
          },
          {
            name: 'horario_inicio',
            description: 'Horário de início (ex: 20:00)',
            type: 3,
            required: false,
          },
          {
            name: 'horario_inscricao',
            description: 'Horário de abertura das inscrições (ex: 19:00)',
            type: 3,
            required: false,
          }
        ]
      },
      {
        name: 'excluirtour',
        description: 'Exclui um torneio existente',
        options: [
          {
            name: 'id',
            description: 'ID do torneio para excluir',
            type: 3,
            required: true,
          }
        ]
      },
      {
        name: 'listartour',
        description: 'Lista todos os torneios ativos'
      },
      {
        name: 'anticheat',
        description: 'Mostra estatísticas do sistema anti-cheat'
      },
      {
        name: 'ban',
        description: 'Bane um device ou IP do servidor',
        options: [
          {
            name: 'tipo',
            description: 'Tipo de ban (device ou ip)',
            type: 3,
            required: true,
            choices: [
              { name: 'Device', value: 'device' },
              { name: 'IP', value: 'ip' }
            ]
          },
          {
            name: 'id',
            description: 'DeviceId ou IP para banir',
            type: 3,
            required: true,
          },
          {
            name: 'razao',
            description: 'Razão do ban',
            type: 3,
            required: false,
          }
        ]
      },
      {
        name: 'unban',
        description: 'Remove ban de um device ou IP',
        options: [
          {
            name: 'tipo',
            description: 'Tipo de unban (device ou ip)',
            type: 3,
            required: true,
            choices: [
              { name: 'Device', value: 'device' },
              { name: 'IP', value: 'ip' }
            ]
          },
          {
            name: 'id',
            description: 'DeviceId ou IP para desbanir',
            type: 3,
            required: true,
          }
        ]
      },
      {
        name: 'whitelist',
        description: 'Adiciona um device à whitelist (VIP/Admin)',
        options: [
          {
            name: 'deviceid',
            description: 'DeviceId para adicionar à whitelist',
            type: 3,
            required: true,
          }
        ]
      },
      {
        name: 'suspeitos',
        description: 'Lista devices e IPs suspeitos',
        options: [
          {
            name: 'tipo',
            description: 'Tipo de lista (devices ou ips)',
            type: 3,
            required: true,
            choices: [
              { name: 'Devices', value: 'devices' },
              { name: 'IPs', value: 'ips' }
            ]
          }
        ]
      },
      {
        name: 'buscaruser',
        description: 'Busca um usuário no banco de dados (debug)',
        options: [
          {
            name: 'userid',
            description: 'ID do usuário (qualquer formato)',
            type: 3,
            required: true,
          }
        ]
      }
    ];

    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );

      Console.log('Bot', 'Comandos slash registrados com sucesso!');
    } catch (error) {
      Console.error('Bot', `Erro ao registrar comandos: ${error.message}`);
    }
  }

  async handleCommand(interaction) {
    const { commandName } = interaction;

    try {
      switch (commandName) {
        case 'manutencao':
          await this.handleMaintenance(interaction);
          break;
        case 'kick':
          await this.handleKick(interaction);
          break;
        case 'nickname':
          await this.handleNickname(interaction);
          break;
        case 'w':
          await this.handleAddW(interaction);
          break;
        case 'removew':
          await this.handleRemoveW(interaction);
          break;
        case 'torneiocriar':
          await this.handleCreateTournament(interaction);
          break;
        case 'excluirtour':
          await this.handleDeleteTournament(interaction);
          break;
        case 'listartour':
          await this.handleListTournaments(interaction);
          break;
        case 'anticheat':
          await this.handleAntiCheatStats(interaction);
          break;
        case 'ban':
          await this.handleBan(interaction);
          break;
        case 'unban':
          await this.handleUnban(interaction);
          break;
        case 'whitelist':
          await this.handleWhitelist(interaction);
          break;
        case 'suspeitos':
          await this.handleSuspicious(interaction);
          break;
        case 'buscaruser':
          await this.handleSearchUser(interaction);
          break;
      }
    } catch (error) {
      Console.error('Bot', `Erro ao executar comando ${commandName}: ${error.message}`);
      await interaction.reply({ 
        content: 'Ocorreu um erro ao executar o comando.', 
        flags: 64 
      });
    }
  }

  async handleMaintenance(interaction) {
    this.maintenanceMode = !this.maintenanceMode;
    
    const embed = new EmbedBuilder()
      .setTitle('🔧 Modo de Manutenção')
      .setDescription(
        this.maintenanceMode 
          ? '✅ Modo de manutenção **ATIVADO**\nNovos jogadores não poderão entrar no servidor.'
          : '✅ Modo de manutenção **DESATIVADO**\nJogadores podem entrar normalmente.'
      )
      .setColor(this.maintenanceMode ? 0xFF0000 : 0x00FF00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    Console.log('Bot', `Manutenção: ${this.maintenanceMode ? 'ON' : 'OFF'}`);
  }

  async handleKick(interaction) {
    const userId = interaction.options.getString('userid');
    
    const { UserModel } = require('./BackendUtils');
    
    try {
      let user = null;
      
      // Tenta buscar de múltiplas formas
      // 1. Por DeviceId
      user = await UserModel.findByDeviceId(userId);
      
      // 2. Por StumbleId
      if (!user) {
        user = await UserModel.findByStumbleId(userId);
      }
      
      // 3. Por ID numérico ou ObjectId
      if (!user) {
        user = await UserModel.findById(userId);
      }
      
      // 4. Por username (busca parcial)
      if (!user) {
        const { database } = require('./BackendUtils');
        user = await database.getUserByQuery({ 
          username: { $regex: new RegExp(userId, 'i') } 
        });
      }
      
      if (!user) {
        const connectedList = this.getConnectedClients();
        const embed = new EmbedBuilder()
          .setTitle('❌ Erro')
          .setDescription(
            `Usuário com ID \`${userId}\` não foi encontrado no banco de dados.\n\n` +
            `**Tentativas de busca:**\n` +
            `• DeviceId: \`${userId}\`\n` +
            `• StumbleId: \`${userId}\`\n` +
            `• ID numérico: \`${userId}\`\n` +
            `• Username: \`${userId}\`\n\n` +
            `**Clientes conectados (${connectedList.length}):**\n` +
            (connectedList.length > 0 ? connectedList.map(id => `• \`${id}\``).join('\n') : '*Nenhum cliente conectado*')
          )
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }
      
      // Marcar TODOS os IDs relacionados para kick
      const idsToKick = [
        user.id?.toString(),
        user._id?.toString(),
        user.deviceId,
        user.stumbleId
      ].filter(Boolean);
      
      idsToKick.forEach(id => {
        this.kickedClients.set(id, Date.now());
      });
      
      // Remover da lista de conectados
      idsToKick.forEach(id => {
        this.connectedClients.delete(id);
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Jogador Marcado para Kick')
        .setDescription(
          `Jogador \`${user.username}\` será desconectado.\n\n` +
          `**IDs marcados:**\n` +
          idsToKick.map(id => `• \`${id}\``).join('\n') + '\n\n' +
          `O jogador será desconectado na próxima vez que verificar o status (até 5 segundos).`
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ ${user.username} kickado`);
      
    } catch (error) {
      Console.error('Bot', `Erro ao buscar usuário: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao buscar o jogador no banco de dados.\n\nErro: ${error.message}`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleNickname(interaction) {
    const newNick = interaction.options.getString('novo_nick');
    const userId = interaction.options.getString('userid');

    const { UserModel } = require('./BackendUtils');

    try {
      let user = null;
      
      // Tenta buscar de múltiplas formas
      user = await UserModel.findByDeviceId(userId);
      
      if (!user) {
        user = await UserModel.findByStumbleId(userId);
      }
      
      if (!user) {
        user = await UserModel.findById(userId);
      }
      
      if (!user) {
        const { database } = require('./BackendUtils');
        user = await database.getUserByQuery({ 
          username: { $regex: new RegExp(userId, 'i') } 
        });
      }

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Erro')
          .setDescription(
            `Usuário com ID \`${userId}\` não foi encontrado no banco de dados.\n\n` +
            `**Tentativas de busca:**\n` +
            `• DeviceId: \`${userId}\`\n` +
            `• StumbleId: \`${userId}\`\n` +
            `• ID numérico: \`${userId}\`\n` +
            `• Username: \`${userId}\``
          )
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      // Aplica o sufixo [W] se estiver habilitado
      let finalNickname = newNick;
      if (user.wSuffix && user.wSuffix.enabled && user.wSuffix.color) {
        finalNickname = `${newNick}<color=#${user.wSuffix.color}>[W]</color>`;
      }

      await UserModel.update(user.stumbleId, { username: finalNickname });

      const embed = new EmbedBuilder()
        .setTitle('✅ Nickname Alterado')
        .setDescription(
          `Nickname do jogador foi alterado para **${newNick}** com sucesso.` +
          (user.wSuffix && user.wSuffix.enabled ? `\n\n🔒 **Sufixo [W] mantido automaticamente!**` : '')
        )
        .addFields(
          { name: 'StumbleId', value: user.stumbleId, inline: true },
          { name: 'DeviceId', value: user.deviceId || 'N/A', inline: true },
          { name: 'ID', value: user.id?.toString() || 'N/A', inline: true },
          { name: 'Username Anterior', value: user.username, inline: false },
          { name: 'Novo Username', value: finalNickname, inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ Nickname ${userId} → ${finalNickname}`);
    } catch (error) {
      Console.error('Bot', `Erro ao alterar nickname: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao alterar o nickname do jogador.\n\nErro: ${error.message}`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleAddW(interaction) {
    const userId = interaction.options.getString('userid');
    const hex = interaction.options.getString('hex').replace('#', '');

    const { UserModel } = require('./BackendUtils');

    try {
      // Valida hex
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Erro')
          .setDescription('Cor hexadecimal inválida! Use formato: `36f700` ou `ff0000`')
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      let user = null;
      
      // Tenta buscar de múltiplas formas
      user = await UserModel.findByDeviceId(userId);
      
      if (!user) {
        user = await UserModel.findByStumbleId(userId);
      }
      
      if (!user) {
        user = await UserModel.findById(userId);
      }
      
      if (!user) {
        const { database } = require('./BackendUtils');
        user = await database.getUserByQuery({ 
          username: { $regex: new RegExp(userId, 'i') } 
        });
      }

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Erro')
          .setDescription(
            `Usuário com ID \`${userId}\` não foi encontrado no banco de dados.\n\n` +
            `**Tentativas de busca:**\n` +
            `• DeviceId: \`${userId}\`\n` +
            `• StumbleId: \`${userId}\`\n` +
            `• ID numérico: \`${userId}\`\n` +
            `• Username: \`${userId}\``
          )
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      // Usa a nova função que habilita o sufixo [W] permanentemente
      const updatedUser = await UserModel.enableWSuffix(user.stumbleId, hex);

      const embed = new EmbedBuilder()
        .setTitle('✅ Sufixo [W] Adicionado Permanentemente')
        .setDescription(
          `Sufixo colorido foi adicionado ao username de **${UserModel.removeWSuffix(user.username)}**\n\n` +
          `🔒 **O sufixo [W] agora é PERMANENTE!**\n` +
          `Mesmo que o jogador troque o nome, o sufixo será mantido automaticamente.\n\n` +
          `Para remover, use: \`/removew userid:${userId}\``
        )
        .addFields(
          { name: 'Username Anterior', value: user.username, inline: false },
          { name: 'Novo Username', value: updatedUser.username, inline: false },
          { name: 'Cor', value: `#${hex}`, inline: true },
          { name: 'StumbleId', value: user.stumbleId, inline: true },
          { name: 'DeviceId', value: user.deviceId || 'N/A', inline: true }
        )
        .setColor(parseInt(hex, 16))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ [W] permanente adicionado para ${UserModel.removeWSuffix(user.username)} (cor: #${hex})`);
    } catch (error) {
      Console.error('Bot', `Erro ao adicionar [W]: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao adicionar o sufixo [W].\n\nErro: ${error.message}`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleRemoveW(interaction) {
    const userId = interaction.options.getString('userid');

    const { UserModel } = require('./BackendUtils');

    try {
      let user = null;
      
      // Tenta buscar de múltiplas formas
      user = await UserModel.findByDeviceId(userId);
      
      if (!user) {
        user = await UserModel.findByStumbleId(userId);
      }
      
      if (!user) {
        user = await UserModel.findById(userId);
      }
      
      if (!user) {
        const { database } = require('./BackendUtils');
        user = await database.getUserByQuery({ 
          username: { $regex: new RegExp(userId, 'i') } 
        });
      }

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Erro')
          .setDescription(
            `Usuário com ID \`${userId}\` não foi encontrado no banco de dados.\n\n` +
            `**Tentativas de busca:**\n` +
            `• DeviceId: \`${userId}\`\n` +
            `• StumbleId: \`${userId}\`\n` +
            `• ID numérico: \`${userId}\`\n` +
            `• Username: \`${userId}\``
          )
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      // Verifica se o usuário tem o sufixo [W] habilitado
      if (!user.wSuffix || !user.wSuffix.enabled) {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Aviso')
          .setDescription('Este usuário não possui sufixo [W] permanente configurado.')
          .setColor(0xFFFF00)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      // Usa a nova função que desabilita o sufixo [W] permanentemente
      const updatedUser = await UserModel.disableWSuffix(user.stumbleId);

      const embed = new EmbedBuilder()
        .setTitle('✅ Sufixo [W] Removido Permanentemente')
        .setDescription(
          `Sufixo foi removido do username\n\n` +
          `🔓 **O sufixo [W] foi desabilitado!**\n` +
          `O jogador não terá mais o sufixo, mesmo ao trocar o nome.`
        )
        .addFields(
          { name: 'Username Anterior', value: user.username, inline: false },
          { name: 'Novo Username', value: updatedUser.username, inline: false },
          { name: 'StumbleId', value: user.stumbleId, inline: true },
          { name: 'DeviceId', value: user.deviceId || 'N/A', inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ [W] permanente removido de ${updatedUser.username}`);
    } catch (error) {
      Console.error('Bot', `Erro ao remover [W]: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao remover o sufixo [W].\n\nErro: ${error.message}`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  isMaintenanceMode() {
    return this.maintenanceMode;
  }

  registerClient(userId, socketInfo) {
    this.connectedClients.set(userId, socketInfo);
  }

  unregisterClient(userId) {
    this.connectedClients.delete(userId);
  }

  getConnectedClients() {
    return Array.from(this.connectedClients.keys());
  }

  isKicked(userId) {
    const kickTime = this.kickedClients.get(userId);
    if (!kickTime) return false;
    
    const now = Date.now();
    if (now - kickTime > 60000) {
      this.kickedClients.delete(userId);
      return false;
    }
    
    return true;
  }

  checkKicked(userId, deviceId, stumbleId) {
    return this.isKicked(userId) || 
           this.isKicked(deviceId) || 
           this.isKicked(stumbleId);
  }

  async handleCreateTournament(interaction) {
    const nome = interaction.options.getString('nome');
    const estilo = interaction.options.getString('estilo');
    const emojis = interaction.options.getString('emojis');
    const mapa = interaction.options.getString('mapa');
    const vagas = interaction.options.getInteger('vagas') || 4;
    const rounds = interaction.options.getInteger('rounds') || 2;
    const horarioInicio = interaction.options.getString('horario_inicio') || 'Imediato';
    const horarioInscricao = interaction.options.getString('horario_inscricao') || 'Agora';

    const TournamentManager = require('./TournamentManager');

    try {
      const tournament = TournamentManager.createTournament({
        name: nome,
        style: estilo,
        emojis: emojis,
        map: mapa,
        maxPlayers: vagas,
        rounds: rounds,
        startTime: horarioInicio,
        registrationTime: horarioInscricao,
        createdBy: interaction.user.id
      });

      const embed = new EmbedBuilder()
        .setTitle('🏆 Torneio Criado!')
        .setDescription(`Torneio **${nome}** foi criado com sucesso!`)
        .addFields(
          { name: 'Estilo', value: estilo, inline: true },
          { name: 'Emojis', value: emojis, inline: true },
          { name: 'Mapa', value: mapa, inline: true },
          { name: 'Vagas', value: `${vagas}`, inline: true },
          { name: 'Rounds', value: `${rounds}`, inline: true },
          { name: 'Inscrições Abrem', value: horarioInscricao, inline: true },
          { name: 'Início', value: horarioInicio, inline: true },
          { name: 'ID', value: tournament.id, inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: 'Acesse https://masterbuckiindi2.shardweb.app/torneios-preview para se inscrever!' });

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ Torneio criado: ${nome}`);
    } catch (error) {
      Console.error('Bot', `Erro ao criar torneio: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao criar o torneio.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleDeleteTournament(interaction) {
    const tournamentId = interaction.options.getString('id');
    const TournamentManager = require('./TournamentManager');

    try {
      const result = TournamentManager.deleteTournament(tournamentId);
      
      if (result.error) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Erro')
          .setDescription(result.error)
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Torneio Excluído')
        .setDescription(`Torneio **${tournamentId}** foi excluído com sucesso!`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ Torneio excluído: ${tournamentId}`);
    } catch (error) {
      Console.error('Bot', `Erro ao excluir torneio: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao excluir o torneio.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleListTournaments(interaction) {
    const TournamentManager = require('./TournamentManager');

    try {
      const tournaments = TournamentManager.getAllTournaments();
      
      if (tournaments.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Lista de Torneios')
          .setDescription('Nenhum torneio encontrado.')
          .setColor(0xFFFF00)
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Lista de Torneios')
        .setDescription(tournaments.map(t => {
          const statusEmoji = {
            'scheduled': '⏰',
            'waiting': '⏳',
            'in_progress': '🎮',
            'finished': '✅'
          }[t.status] || '❓';
          
          return `${statusEmoji} **${t.name}**\n` +
                 `ID: \`${t.id}\`\n` +
                 `Jogadores: ${t.players.length}/${t.maxPlayers}\n` +
                 `Status: ${t.status}\n`;
        }).join('\n'))
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    } catch (error) {
      Console.error('Bot', `Erro ao listar torneios: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao listar os torneios.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleAntiCheatStats(interaction) {
    const AntiCheat = require('./AntiCheatMiddleware');

    try {
      const stats = AntiCheat.getStats();

      const embed = new EmbedBuilder()
        .setTitle('🛡️ Estatísticas do Anti-Cheat')
        .setDescription('Sistema de proteção contra cheats e DLLs modificadas')
        .addFields(
          { name: '🚫 Devices Banidos', value: `${stats.bannedDevices}`, inline: true },
          { name: '🚫 IPs Banidos', value: `${stats.bannedIPs}`, inline: true },
          { name: '⚠️ Devices Suspeitos', value: `${stats.suspiciousDevices}`, inline: true },
          { name: '✅ Whitelist', value: `${stats.whitelistedDevices}`, inline: true },
          { name: '📊 Violações Totais', value: `${stats.totalViolations}`, inline: true },
          { name: '🔥 Violações Recentes', value: `${stats.recentViolations}`, inline: true },
          { name: '⏱️ Rate Limits Ativos', value: `${stats.activeRateLimits}`, inline: true },
          { name: '⚙️ Ban Após', value: `${stats.config.BAN_AFTER_ATTEMPTS} tentativas`, inline: true },
          { name: '📝 Max Req/Min', value: `${stats.config.MAX_REQUESTS_PER_MINUTE}`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: 'Sistema Anti-Cheat v2.0' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      Console.error('Bot', `Erro ao obter stats: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao obter as estatísticas do anti-cheat.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleBan(interaction) {
    const tipo = interaction.options.getString('tipo');
    const id = interaction.options.getString('id');
    const razao = interaction.options.getString('razao') || 'Ban manual via Discord';

    const AntiCheat = require('./AntiCheatMiddleware');

    try {
      if (tipo === 'device') {
        AntiCheat.banDevice(id, razao);
      } else {
        AntiCheat.banIP(id, razao);
      }

      const embed = new EmbedBuilder()
        .setTitle('🚫 Ban Aplicado')
        .setDescription(`${tipo === 'device' ? 'Device' : 'IP'} \`${id}\` foi banido com sucesso!`)
        .addFields(
          { name: 'Tipo', value: tipo === 'device' ? 'Device' : 'IP', inline: true },
          { name: 'ID', value: `\`${id}\``, inline: true },
          { name: 'Razão', value: razao, inline: false }
        )
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ ${tipo} ${id} banido: ${razao}`);
    } catch (error) {
      Console.error('Bot', `Erro ao banir: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao aplicar o ban.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleUnban(interaction) {
    const tipo = interaction.options.getString('tipo');
    const id = interaction.options.getString('id');

    const AntiCheat = require('./AntiCheatMiddleware');

    try {
      if (tipo === 'device') {
        AntiCheat.unbanDevice(id);
      } else {
        AntiCheat.unbanIP(id);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Ban Removido')
        .setDescription(`${tipo === 'device' ? 'Device' : 'IP'} \`${id}\` foi desbanido com sucesso!`)
        .addFields(
          { name: 'Tipo', value: tipo === 'device' ? 'Device' : 'IP', inline: true },
          { name: 'ID', value: `\`${id}\``, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ ${tipo} ${id} desbanido`);
    } catch (error) {
      Console.error('Bot', `Erro ao desbanir: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao remover o ban.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleWhitelist(interaction) {
    const deviceId = interaction.options.getString('deviceid');

    const AntiCheat = require('./AntiCheatMiddleware');

    try {
      AntiCheat.whitelistDevice(deviceId);

      const embed = new EmbedBuilder()
        .setTitle('⭐ Whitelist Atualizada')
        .setDescription(`Device \`${deviceId}\` foi adicionado à whitelist!`)
        .addFields(
          { name: 'DeviceId', value: `\`${deviceId}\``, inline: true },
          { name: 'Benefícios', value: '• Bypass de verificações\n• Sem rate limiting\n• Formatação permitida', inline: false }
        )
        .setColor(0xFFD700)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      Console.log('Bot', `✅ Device ${deviceId} adicionado à whitelist`);
    } catch (error) {
      Console.error('Bot', `Erro ao adicionar à whitelist: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao adicionar à whitelist.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleSuspicious(interaction) {
    const tipo = interaction.options.getString('tipo');

    const AntiCheat = require('./AntiCheatMiddleware');

    try {
      let data, title, description;

      if (tipo === 'devices') {
        data = AntiCheat.getSuspiciousDevices();
        title = '⚠️ Devices Suspeitos';
        description = data.length === 0 
          ? 'Nenhum device suspeito encontrado.'
          : data.slice(0, 10).map((d, i) => 
              `**${i + 1}.** \`${d.deviceId}\`\n` +
              `Violações: ${d.violationCount} | Última: ${new Date(d.lastSeen).toLocaleString('pt-BR')}`
            ).join('\n\n');
      } else {
        data = AntiCheat.getSuspiciousIPs();
        title = '⚠️ IPs Suspeitos';
        description = data.length === 0 
          ? 'Nenhum IP suspeito encontrado.'
          : data.slice(0, 10).map((ip, i) => 
              `**${i + 1}.** \`${ip.ip}\`\n` +
              `Tentativas: ${ip.attemptCount} | Última: ${new Date(ip.lastAttempt).toLocaleString('pt-BR')}`
            ).join('\n\n');
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description + (data.length > 10 ? `\n\n*...e mais ${data.length - 10}*` : ''))
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({ text: `Total: ${data.length}` });

      await interaction.reply({ embeds: [embed], flags: 64 });
    } catch (error) {
      Console.error('Bot', `Erro ao listar suspeitos: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription('Ocorreu um erro ao listar suspeitos.')
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }

  async handleSearchUser(interaction) {
    const userId = interaction.options.getString('userid');
    const { UserModel, database } = require('./BackendUtils');

    try {
      await interaction.deferReply({ flags: 64 });

      const results = {
        byDeviceId: null,
        byStumbleId: null,
        byId: null,
        byUsername: null,
        byObjectId: null
      };

      // Busca por DeviceId
      try {
        results.byDeviceId = await UserModel.findByDeviceId(userId);
      } catch (err) {
        Console.log('Search', `Erro ao buscar por DeviceId: ${err.message}`);
      }

      // Busca por StumbleId
      try {
        results.byStumbleId = await UserModel.findByStumbleId(userId);
      } catch (err) {
        Console.log('Search', `Erro ao buscar por StumbleId: ${err.message}`);
      }

      // Busca por ID numérico
      try {
        results.byId = await UserModel.findById(userId);
      } catch (err) {
        Console.log('Search', `Erro ao buscar por ID: ${err.message}`);
      }

      // Busca por Username (regex)
      try {
        results.byUsername = await database.getUserByQuery({ 
          username: { $regex: new RegExp(userId, 'i') } 
        });
      } catch (err) {
        Console.log('Search', `Erro ao buscar por Username: ${err.message}`);
      }

      // Busca por ObjectId do MongoDB
      try {
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(userId)) {
          results.byObjectId = await database.getUserByQuery({ 
            _id: new ObjectId(userId) 
          });
        }
      } catch (err) {
        Console.log('Search', `Erro ao buscar por ObjectId: ${err.message}`);
      }

      // Monta a resposta
      const foundResults = Object.entries(results)
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => {
          const methodName = {
            byDeviceId: 'DeviceId',
            byStumbleId: 'StumbleId',
            byId: 'ID Numérico',
            byUsername: 'Username (regex)',
            byObjectId: 'MongoDB ObjectId'
          }[key];

          return {
            name: `✅ Encontrado por ${methodName}`,
            value: `**Username:** ${value.username}\n` +
                   `**ID:** ${value.id || 'N/A'}\n` +
                   `**DeviceId:** ${value.deviceId || 'N/A'}\n` +
                   `**StumbleId:** ${value.stumbleId || 'N/A'}\n` +
                   `**MongoDB _id:** ${value._id || 'N/A'}`,
            inline: false
          };
        });

      if (foundResults.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Usuário Não Encontrado')
          .setDescription(
            `Nenhum usuário foi encontrado com o ID \`${userId}\`\n\n` +
            `**Métodos de busca testados:**\n` +
            `• DeviceId\n` +
            `• StumbleId\n` +
            `• ID numérico\n` +
            `• Username (busca parcial)\n` +
            `• MongoDB ObjectId`
          )
          .setColor(0xFF0000)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🔍 Resultado da Busca')
        .setDescription(`Busca por: \`${userId}\`\n\n**${foundResults.length} resultado(s) encontrado(s)**`)
        .addFields(foundResults)
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      Console.log('Bot', `✅ Busca realizada para ${userId}: ${foundResults.length} resultado(s)`);

    } catch (error) {
      Console.error('Bot', `Erro ao buscar usuário: ${error.message}`);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao buscar o usuário.\n\nErro: ${error.message}`)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}

module.exports = new BotManager();
