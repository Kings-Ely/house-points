export default class Path {
    components: string[] = [];
    params: string[] = [];
    paramDict: Record<string, string> = {};

    static parse (path?: string): Path | string {
        const p = new Path();

        const parts = (path || '').split('?');

        if (parts.length > 2) {
            return 'Invalid path - too many ?';

        } else if (parts.length === 2) {
            p.params = parts[1].split('&');

            for (let param of p.params) {
                if (param.includes('=')) {
                    p.paramDict[param.split('=')[0]] = param.split('=')[1];
                }
            }

        } else if (parts.length < 1) {
            return 'Invalid path - no path';
        }

        p.components = parts[0].split('/').filter(Boolean);

        return p;
    }
}
