import MemoryFS from 'memory-fs';
import type { Configuration, webpack as Webpack } from 'webpack';

import { getTempFile } from './util';

type TypeWebpack = typeof Webpack;

export async function webpackCompile({
    webpack,
    config = {
        mode: 'production'
    },
    code
}: {
    webpack: TypeWebpack;
    config?: Configuration;
    code?: string;
}): Promise<string> {
    const webpackConfig = { ...config,
        output: { ...config.output,
            path:     '/',
            filename: 'output.js'
        }
    };
    let tempFile;

    if (code) {
        tempFile = getTempFile();
        await tempFile.write(code);
        webpackConfig.entry = tempFile.filepath;
    }

    const compiler = webpack(webpackConfig);
    compiler.outputFileSystem = new MemoryFS();
    const result = await new Promise<string>((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }

            if (stats?.hasErrors()) {
                return reject(new Error(stats.toString({
                    errorDetails: true,
                    warnings:     true
                })));
            }

            resolve((compiler.outputFileSystem as MemoryFS).data['output.js'].toString());
        });
    });

    if (tempFile) {
        await tempFile.remove();
    }

    return result;
}
