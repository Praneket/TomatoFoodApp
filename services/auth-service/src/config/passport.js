const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { getPrisma } = require('../services/prismaClient');

const prisma = getPrisma();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await prisma.user.findFirst({ where: { OR: [{ googleId: profile.id }, { email }] } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              googleId: profile.id,
              avatar: profile.photos[0]?.value,
              isVerified: true,
              role: 'CUSTOMER',
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            },
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id, isVerified: true } });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
}

module.exports = passport;
