import { PublicKey } from '@solana/web3.js';
import luloIdl from '../utils/lulo.json'

export const programID = new PublicKey(luloIdl.metadata.address);
export const opts = {preflightCommitment: "processed"}
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
export const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const LULO_PROGRAM_ID = new PublicKey('TFZyJb1CNZzTTHTojYaVYhqtmro9gwoP9HHKCfinUs9');
export const DUMMY_APPROVER = new PublicKey('54oTgjkjNr5kBtJSbxwk2tqLAsY831KKDCwTMNxeQM5q');