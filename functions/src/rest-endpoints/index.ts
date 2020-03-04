import { Request, Response } from "firebase-functions";
import { firestoreInstance } from "..";
import { MATCH_DATA_SHEETS } from "../constants";

export async function mergeDataSheets(req: Request, res: Response) {
    const batch = firestoreInstance.batch();
    const matchDataSheets: Array<any> = req.body.matchDataSheets;
    
    // Get an instance of the match data sheets collection.
    const matchDataSheetsRef = firestoreInstance.collection(MATCH_DATA_SHEETS);

    // Create a document for each match data sheet, if applicable.
    matchDataSheets.forEach(sheet => {
        const matchDataSheetDocRef = matchDataSheetsRef.doc(sheet.id);
        batch.set(matchDataSheetDocRef, sheet, {merge:true});
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
