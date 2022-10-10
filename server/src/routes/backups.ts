import route from '../index';
import fs from 'fs/promises';
import { existsSync } from "fs";
import log from "../log";
import { AUTH_ERR, generateUUId, isAdmin } from "../util";
import mysqldump, { ConnectionOptions } from "mysqldump";

const BACKUP_PATH = './backups/';
const BACKUP_EXT = '.dump.sql';

route('get/backups', async ({ query, body }) => {
	if (!await isAdmin(body, query)) return AUTH_ERR;
	
	const files: string[] = [];
	
	for (let file of await fs.readdir(BACKUP_PATH)) {
		// just add file name
		const name = file.split('.')[0];
		if (name) {
			files.push();
		}
	}
	
	return {
		data: files
	};
});

route('create/backups', async ({ query, body }) => {
	if (!await isAdmin(body, query)) return AUTH_ERR;
	
	if (!existsSync(BACKUP_PATH)) {
		await fs.mkdir(BACKUP_PATH);
	}
	
	const id = await generateUUId('backup');
	const dumpToFile = `${BACKUP_PATH}${id}${BACKUP_EXT}`;
	
	const connection: ConnectionOptions = {
		host: process.env.DB_HOST,
		user: process.env.DB_USER || '',
		password: process.env.DB_PASS || '',
		database: process.env.DB || '',
		port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
	};
	
	await mysqldump({
		connection,
		dumpToFile
	}).catch(e => {
		log.error(`Error in mysqldump (making backup): ${e}`);
	});
	
	return { name: id };
});

route('update/backups/restore-from', async ({ query, body }) => {
	if (!await isAdmin(body, query)) return AUTH_ERR;
	
	const { backupName } = body;
	if (typeof backupName !== 'string' || !backupName) {
		return 'Invalid body.backupId: must be string';
	}
	
	const path = `${BACKUP_PATH}${backupName}${BACKUP_EXT}`;
	
	if (!existsSync(path)) {
		return 'That backup does not exist :/';
	}
});

route('update/backups/name', async ({ query, body }) => {
	if (!await isAdmin(body, query)) return AUTH_ERR;
	
	const { backupName, name } = body;
	
	if (typeof backupName !== 'string') {
		return `Invalid 'backupName': must be a string`;
	}
	
	if (typeof name !== 'string' || !name) {
		return 'Invalid name';
	}
	
	const oldPath = `${BACKUP_PATH}${backupName}${BACKUP_EXT}`;
	const newPath = `${BACKUP_PATH}${name}${BACKUP_EXT}`;
	
	if (!existsSync(oldPath)) {
		return 'That backup does not exist';
	}
	
	if (existsSync(oldPath)) {
		return 'That backup already exists';
	}
	
	await fs.rename(oldPath, newPath);
});

route('delete/backups', async ({ query, body }) => {
	if (!await isAdmin(body, query)) return AUTH_ERR;
	
	const { backupName } = body;
	
	const path = `${BACKUP_PATH}${backupName}${BACKUP_EXT}`;
	
	if (!existsSync(path)) {
		return 'That backup does not exist';
	}
	
	await fs.rm(path);
});