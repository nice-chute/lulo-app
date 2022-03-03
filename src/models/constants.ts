import { PublicKey } from '@solana/web3.js';
import idl from '../utils/idl.json'

export const programID = new PublicKey(idl.metadata.address);
export const opts = {preflightCommitment: "processed"}
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
export const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');