export function isNullOrEmpty(value: string) : boolean {
    return (!value || 0 === value.length);
}

export function isNullOrBlank(value: string) : boolean {
    return (!value || /^\s*$/.test(value));
}
