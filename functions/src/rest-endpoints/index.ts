import { Request, Response } from "firebase-functions";
import { firestoreInstance } from "..";
import { MATCH_DATA_SHEETS, ROBOT_DATA_SHEETS } from "../constants";

/**
 * Merges the data sheets sent by the client with the ones present on Cloud
 * Firestore.
 * 
 * @param req A Request object representing the request sent by the client.
 * @param res A Response object representing the response sent by the server
 *            onces it finishes processing the request.
 */
export async function mergeDataSheets(req: Request, res: Response) {
    const batch = firestoreInstance.batch();
    const matchDataSheets: Array<any> = req.body.matchDataSheets;
    const robotDataSheets: Array<any> = req.body.robotDataSheets;

    // Get an instance of the match data sheets collection.
    const matchDataSheetsRef = firestoreInstance.collection(MATCH_DATA_SHEETS);

    // Get an instance of the robot data sheets collection.
    const robotDataSheetsRef = firestoreInstance.collection(ROBOT_DATA_SHEETS);

    // Create a document for each match data sheet, if applicable.
    matchDataSheets.forEach(sheet => {
        const matchDataSheetDocRef = matchDataSheetsRef.doc(sheet.id);
        batch.set(matchDataSheetDocRef, sheet, {merge:true});
    });
    
    // Create a document for each robot sheet, if applicable.
    robotDataSheets.forEach(sheet => {
        const robotDataSheetDocRef = robotDataSheetsRef.doc(sheet.id);
        batch.set(robotDataSheetDocRef, sheet, {merge:true});
    });

    // Commit the batch.
    try {
        await batch.commit();

        // Inform the client that the merge operation was successfully completed.
        res.status(201).json({ data: req.body, errors: null });
    } catch (err) {
        res.status(501).json({ data: null, errors: [err] });
    };

    return;
}
