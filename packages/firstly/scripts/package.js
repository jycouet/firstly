import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { exit } from 'process'

// Some constants
const toCopy = ['README.md', 'LICENSE', 'CHANGELOG.md']
const tmpFolder = 'dist-tmp'

// Where are we?
const packageDirPath = process.cwd()

// package.json
const packageJsonPath = path.join(packageDirPath, 'package.json')
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

// replace dep with workspace version
const packagesPath = path.join(packageDirPath, '..')
const packages = fs.readdirSync(packagesPath)
for (let i = 0; i < packages.length; i++) {
	const currentPkg = JSON.parse(
		fs.readFileSync(path.join(packageDirPath, '..', packages[i], 'package.json'), 'utf-8'),
	)
	if (pkg?.dependencies?.[currentPkg.name]) {
		pkg.dependencies[currentPkg.name] = currentPkg.version
	}
}

// adjust pkg json however you like ...
delete pkg.publishConfig
delete pkg.scripts
delete pkg.devDependencies
delete pkg.files

// It's not allowed to have an empty scripts object
pkg.scripts = {
	test: `echo hello ${pkg.name}!`,
}

// let's move dist to another layer of dist!
execSync(`rm -rf ${path.join(packageDirPath, tmpFolder)}`)
fs.mkdirSync(path.join(packageDirPath, tmpFolder))
fs.writeFileSync(path.join(packageDirPath, tmpFolder, 'package.json'), JSON.stringify(pkg, null, 2))
copy(path.join(packageDirPath, 'dist'), path.join(packageDirPath, tmpFolder, 'esm'), {}, [])
// write it to your output directory
for (const item of toCopy) {
	let from = path.join(packageDirPath, item)
	// check if we have a global file? (2 levels up)
	if (!fs.existsSync(from)) {
		from = path.join(packageDirPath, '../..', item)
	}
	if (!fs.existsSync(from)) {
		console.error(`File missing: "${from}"`)
		exit(1)
	}
	const to = path.join(packageDirPath, tmpFolder, item)
	fs.writeFileSync(to, fs.readFileSync(from, 'utf-8'))
}

execSync(`rm -rf ${path.join(packageDirPath, 'dist')}`)
fs.renameSync(path.join(packageDirPath, tmpFolder), path.join(packageDirPath, 'dist'))

console.info(`✅ scripts/package "${pkg.name}" done`)

function copy(
	/** @type {string} */ sourceDir,
	/** @type {string} */ destDir,
	/** @type {Record<string, string>} */ transformMap = {},
	/** @type {string[]} */ ignoreList = [],
) {
	if (!fs.existsSync(destDir)) {
		fs.mkdirSync(destDir)
	}

	const files = fs.readdirSync(sourceDir)
	for (const file of files) {
		const sourceFilePath = path.join(sourceDir, file)
		const sourceRelative = path.relative(process.cwd(), sourceFilePath)
		// skip the ignore list
		if (
			!ignoreList.includes(sourceRelative) &&
			!sourceRelative.includes('spec.') &&
			!sourceRelative.includes('test.')
		) {
			const destFilePath = path.join(destDir, file)

			const stats = fs.statSync(sourceFilePath)

			// files need to be copied and potentially transformed
			if (stats.isFile()) {
				// read the source file
				const source = fs.readFileSync(sourceFilePath)

				// apply any transformations if necessary
				const transformed = Object.entries(transformMap).reduce((prev, [pattern, value]) => {
					return prev.replaceAll(pattern, value)
				}, source.toString())

				// write the result
				fs.writeFileSync(destFilePath, transformed)
			}
			// if we run into a directory then we should keep going
			else if (stats.isDirectory()) {
				copy(sourceFilePath, destFilePath, transformMap, ignoreList)
			}
		}
	}
}
