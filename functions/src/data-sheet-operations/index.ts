export enum Endgame {
    Park = "PARK",
    None = "NONE",
    Climb = "CLIMB"
}

export function updateCountFromBoolean(currentCount: number, booleanValue: boolean) {
    if (booleanValue) return currentCount + 1;
    return currentCount;
}

export function updateEndgameActionCount(currentActionCount: number, actionString: string, targetAction: Endgame) : Number {
    if (endgameFromString(actionString) === targetAction) return currentActionCount + 1;
    return currentActionCount;
}

/**
 * Resolves whether or not the given climb duration is eligible for statistics production.
 * 
 * @param value A string representing the climb duration.
 */
export function climbDurationValidForStatisticsProduction(value: string) : boolean {
    if (value === "FAST")   return true;
    if (value === "MEDIUM") return true;
    return false;
}

/**
 * Returns an Endgame enum from the given string, or undefined if the string does not
 * match any valid Endgame case.
 * 
 * @param A string representing the Endgame.
 */
function endgameFromString(value: string) {
    if (value === "PARK") {
        return Endgame.Park;
    } else if (value === "NONE") {
        return Endgame.None
    } else if (value == "CLIMB") {
        return Endgame.Climb;
    }
    return undefined;
}
