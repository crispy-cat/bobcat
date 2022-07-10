/*
	Bobcat bot for Revolt
	crispycat <the@crispy.cat>
	https://crispy.cat/software/bobcat
	https://github.com/crispy-cat/bobcat
	Licensed under the GNU GPL v3 license
*/

const enum AccessLevel {
	BOTBAN	=-1,
	NORMAL	= 0,
	MOD		= 1,
	ADMIN	= 2,
	OWNER	= 3,
	BOT_ADMIN=4,
	BOT_OWNER=5
}

export default AccessLevel;
