/*
_  ______   _____ _____ _____ _   _
| |/ / ___| |_   _| ____/___ | | | |
| ' / |  _    | | |  _|| |   | |_| |
| . \ |_| |   | | | |__| |___|  _  |
|_|\_\____|   |_| |_____\____|_| |_|

ANYWAY, YOU MUST GIVE CREDIT TO MY CODE WHEN COPY IT
CONTACT ME HERE +237656520674
YT: KermHackTools
Github: Kgtech-cmr
*/

const config = require('../config');
const { cmd } = require('../command');

let stopKickall = false; // Flag to stop the kickall command

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

cmd({
    pattern: "kickall",
    desc: "Kicks all non-admin members from the group continuously until stopped.",
    react: "🧨",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, {
    from,
    isGroup,
    sender,
    isAdmins,
    isOwner,
    groupMetadata,
    groupAdmins,
    isBotAdmins,
    reply
}) => {
    try {
        // Ensure the command is used in a group
        if (!isGroup) return reply(`❌ This command can only be used in groups.`);

        // Ensure the user is an admin
        if (!isAdmins) return reply(`❌ Only group admins can use this command.`);

        // Ensure the bot has admin privileges
        if (!isBotAdmins) return reply(`❌ I need admin privileges to remove group members.`);

        stopKickall = false; // Reset stop flag

        // Warning message
        reply(`⚠️ *Warning!* The bot will continuously remove all non-admin members until they are gone or the command is stopped using *.stop*.`);

        while (true) {
            // Get the latest list of participants
            const allParticipants = groupMetadata.participants;
            const nonAdminParticipants = allParticipants.filter(member => 
                !groupAdmins.includes(member.id) && member.id !== conn.user.jid
            );

            if (nonAdminParticipants.length === 0) {
                reply(`✅ No more non-admin members to remove.`);
                break; // Exit loop when no non-admins remain
            }

            for (let participant of nonAdminParticipants) {
                if (stopKickall) {
                    reply(`✅ *Operation stopped by the user.* Some members may not have been removed.`);
                    return;
                }

                await conn.groupParticipantsUpdate(from, [participant.id], "remove")
                    .catch(err => console.error(`⚠️ Failed to remove ${participant.id}:`, err));

                await delay(1000); // Wait 1 second before removing the next participant
            }
        }
    } catch (e) {
        console.error('Error while executing kickall:', e);
        reply('❌ An error occurred while executing the command.');
    }
});

// Command to stop the kickall execution
cmd({
    pattern: "stop",
    desc: "Stops the ongoing kickall process.",
    react: "⏹️",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    stopKickall = true; // Set the stop flag to true
    reply(`✅ *Kickall operation has been stopped by the user.*`);
});

cmd({
  pattern: "kick",
  desc: "Removes a participant by replying to or mentioning their message.",
  react: "🚪",
  category: "group",
  filename: __filename,
}, async (conn, mek, m, {
  from,
  quoted,
  isGroup,
  sender,
  isAdmins,
  isOwner,
  groupMetadata,
  participants,
  isBotAdmins,
  reply
}) => {
  try {
    // Vérifier que la commande est utilisée dans un groupe
    if (!isGroup) return reply(`❌ This command can only be used in groups.`);
    // Vérifier que l'utilisateur est admin ou owner
    if (!isAdmins && !isOwner) return reply(`❌ Only group admins or the owner can use this command.`);
    // Vérifier que le bot est admin
    if (!isBotAdmins) return reply(`❌ I need admin privileges to remove group members.`);
    
    // Récupérer la cible : soit par réponse, soit par mention
    let target;
    if (m.quoted) {
      target = m.quoted.sender; // Utilise l'expéditeur du message cité
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
      target = m.mentionedJid[0]; // Utilise le premier numéro mentionné
    }
    
    if (!target) {
      return reply(`❌ Please mention or reply to the message of the participant to remove.`);
    }
    
    // Vérifier si la cible est un admin du groupe
    const adminIds = participants.filter(p => p.admin).map(p => p.id);
    if (adminIds.includes(target)) {
      return reply(`❌ You cannot remove a group admin.`);
    }
    
    // Tenter de retirer l'utilisateur du groupe
    await conn.groupParticipantsUpdate(from, [target], "remove")
      .then(() => {
        reply(`✅ Success! The participant has been removed from the group.`);
      })
      .catch(err => {
        console.error(`⚠️ Failed to remove ${target}:`, err);
        reply(`❌ An error occurred while trying to remove the participant.`);
      });
      
  } catch (e) {
    console.error('Error while executing kick:', e);
    reply('❌ An error occurred while executing the command.');
  }
});