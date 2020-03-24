export interface UbjsonEncoderOptions {
	optimizeArrays: boolean | 'onlyTypedArrays';
	optimizeObjects: boolean;
}

export interface UbjsonDecoderOptions {
	int64Handling: 'error' | 'skip' | 'raw';
	highPrecisionNumberHandling: 'error' | 'skip' | 'raw';
	useTypedArrays: boolean;
}

export declare class UbjsonEncoder {
	constructor(options?: Partial<UbjsonEncoderOptions>);
	encode(value: any): ArrayBuffer;
}

export declare class UbjsonDecoder {
	constructor(options?: Partial<UbjsonDecoderOptions>);
	decode(buffer: ArrayBuffer): any;
}

export declare function encode(value: any, options?: Partial<UbjsonEncoderOptions>): ArrayBuffer;
export declare function decode(buffer: ArrayBuffer, options?: Partial<UbjsonDecoderOptions>): any;

export type Ubjson = {
	encode(value: any, options?: Partial<UbjsonEncoderOptions>): ArrayBuffer;
	decode(buffer: ArrayBuffer, options?: Partial<UbjsonDecoderOptions>): any;
};
