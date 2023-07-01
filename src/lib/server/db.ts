import { env } from '$env/dynamic/private'
import postgres from 'postgres'
const { DATABASE_URL } = env;

const sql = postgres(DATABASE_URL)

export default sql
