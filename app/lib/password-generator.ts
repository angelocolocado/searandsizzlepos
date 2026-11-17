import generator from 'generate-password-browser'

export const generatePassword = () => {
    const newPassword = generator.generate({
        length: 12,
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true,
        excludeSimilarCharacters: true,
        strict: true
    })

    return newPassword
}