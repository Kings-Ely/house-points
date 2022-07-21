import { $ } from "zx";
import { config} from 'dotenv';

export default async function () {

	// setup environment variables
	config({ path: './server/.env' });

	// clear and allow it to throw error if the db is not of the correct schema
	console.log(`Clearing database...`);
	await $`
		sudo mysql;
		DROP DATABASE hpsnea;
		CREATE DATABASE hpsnea;
		exit;
	`;

	console.log(`Setting up database...`);
	await $`
		mysql -u ${process.env.DB_USER} -p${process.env.DB_PASS};
		use ${process.env.DB};
		source ${process.env.ROOT_PATH}/sql/schema.sql;
		source ${process.env.ROOT_PATH}/sql/mock-data.sql;
		exit;
	`;
}
