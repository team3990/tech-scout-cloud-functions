import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions';

import * as restEndpoints from './rest-endpoints';
import * as atomicFunctions from './atomic-operations/index'

admin.initializeApp();

export const firestoreInstance = admin.firestore();

exports.processDataSheet = functions.firestore
    .document('matchDataSheets/{sheetId}')
    .onCreate(event => {
        return atomicFunctions.updateTeamAfterDataSheetUpload(event);
    });

exports.mergeDataSheets = functions.https
    .onRequest((req, res) => {
        return restEndpoints.mergeDataSheets(req, res);
    });
