import { TEAMS, TEAM_STATISTICS, POWER_CELL_STATISTICS, COMMENTS, CLIMB_DURATION_STATISTICS } from "../constants";
import { firestoreInstance } from "..";
import { firestore } from "firebase-admin";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import { updateEndgameActionCount, Endgame, updateCountFromBoolean, climbDurationValidForStatisticsProduction } from "../data-sheet-operations";
import { isNullOrEmpty, isNullOrBlank } from "../utils";

export async function updateTeamAfterDataSheetUpload(event: DocumentSnapshot) {
    const eventData = event.data();

    // Return if the event's data is undefined.
    if (eventData === undefined) return;

    // Get the number of the team the update concerns.
    const teamNumber = eventData.teamNumber;

    try {
        // Create a record for the team, if applicable.
        await createTeamRecordIfNeeded(teamNumber)

        // Create a statistics record for the team, if applicable.
        await createTeamStatisticsIfNeeded(teamNumber, eventData.regionalName);

        // Produce the team's statistics.
        await produceTeamStatistics(teamNumber, eventData);

        // Produce the team's statistics for Power Cells.
        await produceTeamPowerCellStatistics(teamNumber, eventData);

        // Production the team's statistics for climb durations.
        await produceTeamClimbDurationStatistics(teamNumber, eventData);

        // Updates the list of comments written about the team.
        await updateComments(teamNumber, eventData);
    } catch (err) {
        console.error('Failed updating the statistics of the team', teamNumber, 'after uploading a data sheet with error', err);        
    }
}

/**
 * Updates the list of comments written for the team with the given number.
 * 
 * @param teamNumber    A number representing the number of the team the comment
 *                      was written about.
 * @param gameDataSheet A firestore.DocumentData representing the data contained in the 
 *                      game's sheet
 */
async function updateComments(teamNumber: number, gameDataSheet: firestore.DocumentData) {
    if (isNullOrEmpty(gameDataSheet.comments) || isNullOrBlank(gameDataSheet.comments)) return;

    // Get a reference to the comments collection.
    const commentsRef = firestoreInstance.collection(COMMENTS);

    // Create a record for the comment.
    commentsRef.add({
        content:      gameDataSheet.comments,
        teamNumber:   teamNumber,
        writerName:   gameDataSheet.scouterName,
        matchNumber:  gameDataSheet.matchNumber,
        regionalName: gameDataSheet.regionalName
    });
}

/**
 * Produces the statistics for the team with the given number.
 * 
 * @param teamNumber    A number representing the number of the team the statistics
 *                      belong to.
 * @param gameDataSheet A firestore.DocumentData representing the data contained in the 
 *                      game's sheet
 */
async function produceTeamStatistics(teamNumber: number, gameDataSheet: firestore.DocumentData) {
    const teamStatisticsQueryResults = await firestoreInstance.collection(TEAM_STATISTICS).where('teamNumber', '==', teamNumber).get();
    const teamStatisticsRecord = teamStatisticsQueryResults.docs[0];

    // Get the content of team statistics record.
    const teamStatistics = teamStatisticsRecord.data();

    // Return if the record does not exist.
    if (teamStatistics === undefined) { return; }

    // Update the team statistics record.
    return await teamStatisticsRecord.ref.update({
        playedGamesCount:           teamStatistics.playedGamesCount + 1,
        actionParkCount:            updateEndgameActionCount(teamStatistics.actionParkCount, gameDataSheet.endgame, Endgame.Park),
        actionNoneCount:            updateEndgameActionCount(teamStatistics.actionNoneCount, gameDataSheet.endgame, Endgame.None),
        actionClimbCount:           updateEndgameActionCount(teamStatistics.actionClimbCount, gameDataSheet.endgame, Endgame.Climb),
        rotationControlCount:       updateCountFromBoolean(teamStatistics.rotationControlCount, gameDataSheet.rotationControl),
        positionControlCount:       updateCountFromBoolean(teamStatistics.positionControlCount, gameDataSheet.positionControl),
        movesToInitiationLineCount: updateCountFromBoolean(teamStatistics.movesToInitiationLineCount, gameDataSheet.movesToInitiationLine),
    });
}

/**
 * Produces power-cell related statistics for the team with the given number.
 * 
 * @param teamNumber    A number representing the number of the team the statistics
 *                      belong to.
 * @param gameDataSheet A firestore.DocumentData representing the data contained in the 
 *                      game's sheet.
 */
async function produceTeamPowerCellStatistics(teamNumber: number, gameDataSheet: firestore.DocumentData) {
    const teamPowerCellStatisticsRef = firestoreInstance.collection(POWER_CELL_STATISTICS);

    // Create a new document for the give ngame.
    return teamPowerCellStatisticsRef.add({
        teamNumber:               teamNumber,
        matchNumber:              gameDataSheet.matchNumber,
        regionalName:             gameDataSheet.regionalName,
        autoInnerPortPowerCells:  gameDataSheet.autoInnerPortPowerCells,
        autoOuterPortPowerCells:  gameDataSheet.autoOuterPortPowerCells,
        autoBottomPortPowerCells: gameDataSheet.autoBottomPortPowerCells,
        teleInnerPortPowerCells:  gameDataSheet.teleInnerPortPowerCells,
        teleOuterPortPowerCells:  gameDataSheet.teleOuterPortPowerCells,
        teleBottomPortPowerCells: gameDataSheet.teleBottomPortPowerCells,
    });
}

/**
 * Produces climb duration related statistics for the team with the given number.
 * 
 * @param teamNumber    A number representing the number of the team the statistics
 *                      belong to.
 * @param gameDataSheet A firestore.DocumentData representing the data contained in the 
 *                      game's sheet.
 */
async function produceTeamClimbDurationStatistics(teamNumber: number, gameDataSheet: firestore.DocumentData) {
    if (!climbDurationValidForStatisticsProduction(gameDataSheet.climbDuration)) return;

    // Get a reference to the climb duration statistics collection.
    const climbDurationStatisticsRef = firestoreInstance.collection(CLIMB_DURATION_STATISTICS);

    // Create a new document for the given game.
    return climbDurationStatisticsRef.add({
        teamNumber:    teamNumber,
        matchNumber:   gameDataSheet.matchNumber,
        regionalName:  gameDataSheet.regionalName,
        climbDuration: gameDataSheet.climbDuration
    });
}

/** 
 * Creates a Cloud Firestore statistics record for the team with the given
 * number.
 * 
 * @param teamNumber    A number representing the number of team the record belongs to.
 * @param regionalName  A string representing the regional for which the statistics were produced.
*/
async function createTeamStatisticsIfNeeded(teamNumber: number, regionalName: string) {
    const teamStatisticsQueryResult = await firestoreInstance.collection(TEAM_STATISTICS).where('teamNumber', '==', teamNumber).get();

    // We do not need to create a statistics record for the team.
    if (!teamStatisticsQueryResult.empty) return;

    // We need to create a statistics record for the team.
    const writeResult = await firestoreInstance.collection(TEAM_STATISTICS).doc().create({
        teamNumber:                 teamNumber,
        regionalName:               regionalName,
        playedGamesCount:           0,
        actionParkCount:            0,
        actionNoneCount:            0,
        actionClimbCount:          0,
        rotationControlCount:       0,
        positionControlCount:       0,
        movesToInitiationLineCount: 0,
        timestamp: firestore.FieldValue.serverTimestamp()
    });

    return writeResult;
}

/**
 * Creates a Cloud Firestore record for the team with the given number
 * 
 * @param teamNumber A number representing the number of team the record belongs to.
 */
async function createTeamRecordIfNeeded(teamNumber: number) {
    const queryTeamRecordResults = await firestoreInstance.collection(TEAMS).where('teamNumber', '==', teamNumber).get();
    
    // We do not need to create a record for the team.
    if (!queryTeamRecordResults.empty) return;

    // We need to create a record for the team.
    const writeResult = await firestoreInstance.collection(TEAMS).doc().create({
        teamNumber: teamNumber,
        timestamp: firestore.FieldValue.serverTimestamp()
    });
    
    return writeResult;
}
