import { ESLintConfigBuilder } from "eslint-config-builder"
import tseslint from "typescript-eslint"

const eslintConfig = new ESLintConfigBuilder().jsonYamlToml().build()

export default tseslint.config({ ignores: ["dist/**"] }, eslintConfig)
