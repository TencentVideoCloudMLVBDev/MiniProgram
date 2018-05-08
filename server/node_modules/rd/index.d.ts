/**
 * 列出目录下的所有文件
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */

import * as fs from 'fs';

/**
 * 回调函数
 */
export type Callback1 = (err?: Error | null) => void;

export type Callback2 = (err?: Error | null, ret?: string[]) => void;

export type FindOneCallback = (filename?: string, stats?: fs.Stats, next?: Callback1) => void;

export type FindFilter = RegExp | ((filename?: string) => boolean);

/**
 * 遍历目录下的所有文件和目录
 */
export function each(dir: string, findOne: FindOneCallback, callback: Callback1): void;
/**
 * 遍历目录下的所有文件和目录
 */
export function each(dir: string, thread_num: number, findOne: FindOneCallback, callback: Callback1): void;

/**
 * 遍历目录下的所有文件和目录
 */
export function eachSync(dir: string, findOne: FindOneCallback): void;
/**
 * 遍历目录下的所有文件和目录
 */
export function eachSync(dir: string, thread_num: number, findOne: FindOneCallback): void;

/**
 * 遍历目录下的所有文件
 */
export function eachFile(dir: string, findOne: FindOneCallback, callback: Callback1): void;
/**
 * 遍历目录下的所有文件
 */
export function eachFile(dir: string, thread_num: number, findOne: FindOneCallback, callback: Callback1): void;

/**
 * 遍历目录下的所有文件
 */
export function eachFileSync(dir: string, findOne: FindOneCallback): void;
/**
 * 遍历目录下的所有文件
 */
export function eachFileSync(dir: string, thread_num: number, findOne: FindOneCallback): void;

/**
 * 遍历目录下的所有目录
 */
export function eachDir(dir: string, findOne: FindOneCallback, callback: Callback1): void;
/**
 * 遍历目录下的所有目录
 */
export function eachDir(dir: string, thread_num: number, findOne: FindOneCallback, callback: Callback1): void;

/**
 * 遍历目录下的所有目录
 */
export function eachDirSync(dir: string, findOne: FindOneCallback): void;
/**
 * 遍历目录下的所有目录
 */
export function eachDirSync(dir: string, thread_num: number, findOne: FindOneCallback): void;

/**
 * 仅列出目录下指定规则的所有文件和目录
 */
export function eachFilter(dir: string, pattern: FindFilter, callback: Callback1): void;
/**
 * 仅列出目录下指定规则的所有文件和目录
 */
export function eachFilter(dir: string, pattern: FindFilter, thread_num: number, callback: Callback1): void;

/**
 * 仅列出目录下指定规则的所有文件和目录
 */
export function eachFilterSync(dir: string, pattern: FindFilter): void;
/**
 * 仅列出目录下指定规则的所有文件和目录
 */
export function eachFilterSync(dir: string, pattern: FindFilter, thread_num: number): void;

/**
 * 仅列出目录下指定规则的所有文件
 */
export function eachFileFilter(dir: string, pattern: FindFilter, callback: Callback1): void;
/**
 * 仅列出目录下指定规则的所有文件
 */
export function eachFileFilter(dir: string, pattern: FindFilter, thread_num: number, callback: Callback1): void;

/**
 * 仅列出目录下指定规则的所有文件
 */
export function eachFileFilterSync(dir: string, pattern: FindFilter): void;
/**
 * 仅列出目录下指定规则的所有文件
 */
export function eachFileFilterSync(dir: string, pattern: FindFilter, thread_num: number): void;


/**
 * 仅列出目录下指定规则的所有目录
 */
export function eachDirFilter(dir: string, pattern: FindFilter, callback: Callback1): void;
/**
 * 仅列出目录下指定规则的所有目录
 */
export function eachDirFilter(dir: string, pattern: FindFilter, thread_num: number, callback: Callback1): void;

/**
 * 仅列出目录下指定规则的所有目录
 */
export function eachDirFilterSync(dir: string, pattern: FindFilter): void;
/**
 * 仅列出目录下指定规则的所有目录
 */
export function eachDirFilterSync(dir: string, pattern: FindFilter, thread_num: number): void;


/**
 * 列出目录下所有文件和目录
 */
export function read(dir: string, callback: Callback2): void;
/**
 * 列出目录下所有文件和目录
 */
export function read(dir: string, thread_num: number, callback: Callback2): void;

/**
 * 列出目录下所有文件和目录
 */
export function readSync(dir: string): string[];
/**
 * 列出目录下所有文件和目录
 */
export function readSync(dir: string, thread_num: number): string[];

/**
 * 列出目录下所有文件
 */
export function readFile(dir: string, callback: Callback2): void;
/**
 * 列出目录下所有文件
 */
export function readFile(dir: string, thread_num: number, callback: Callback2): void;

/**
 * 列出目录下所有文件
 */
export function readFileSync(dir: string): string[];
/**
 * 列出目录下所有文件
 */
export function readFileSync(dir: string, thread_num: number): string[];

/**
 * 列出目录下所有目录
 */
export function readDir(dir: string, callback: Callback2): void;
/**
 * 列出目录下所有目录
 */
export function readDir(dir: string, thread_num: number, callback: Callback2): void;

/**
 * 列出目录下所有目录
 */
export function readDirSync(dir: string): string[];
/**
 * 列出目录下所有目录
 */
export function readDirSync(dir: string, thread_num: number): string[];

/**
 * 列出目录下指定规则的所有文件和目录
 */
export function readFilter(dir: string, pattern: FindFilter, callback: Callback2): void;
/**
 * 列出目录下指定规则的所有文件和目录
 */
export function readFilter(dir: string, pattern: FindFilter, thread_num: number, callback: Callback2): void;

/**
 * 列出目录下指定规则的所有文件和目录
 */
export function readFilterSync(dir: string, pattern: FindFilter): string[];
/**
 * 列出目录下指定规则的所有文件和目录
 */
export function readFilterSync(dir: string, pattern: FindFilter, thread_num: number): string[];

/**
 * 列出目录下指定规则的所有文件
 */
export function readFileFilter(dir: string, pattern: FindFilter, callback: Callback2): void;
/**
 * 列出目录下指定规则的所有文件
 */
export function readFileFilter(dir: string, pattern: FindFilter, thread_num: number, callback: Callback2): void;

/**
 * 列出目录下指定规则的所有文件
 */
export function readFileFilterSync(dir: string, pattern: FindFilter): string[];
/**
 * 列出目录下指定规则的所有文件
 */
export function readFileFilterSync(dir: string, pattern: FindFilter, thread_num: number): string[];

/**
 * 列出目录下指定规则的所有目录
 */
export function readDirFilter(dir: string, pattern: FindFilter, callback: Callback2): void;
/**
 * 列出目录下指定规则的所有目录
 */
export function readDirFilter(dir: string, pattern: FindFilter, thread_num: number, callback: Callback2): void;

/**
 * 列出目录下指定规则的所有目录
 */
export function readDirFilterSync(dir: string, pattern: FindFilter): string[];
/**
 * 列出目录下指定规则的所有目录
 */
export function readDirFilterSync(dir: string, pattern: FindFilter, thread_num: number): string[];
