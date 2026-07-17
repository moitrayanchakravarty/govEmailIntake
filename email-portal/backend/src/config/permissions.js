/**
 * Access-control definitions for the Better Auth `admin` plugin.
 *
 * This app has exactly two roles — nothing else should ever exist:
 *   - office_admin    : scoped to their own office's registry records only
 *   - portal_manager   : sees and manages everything, across all offices
 *
 * Keeping this in its own file (rather than inline in auth.js) means both
 * auth.js (server) and any future admin-panel code can import the same
 * role definitions without duplicating them.
 */

const { createAccessControl } = require('better-auth/plugins/access');
const { defaultStatements, adminAc } = require('better-auth/plugins/admin/access');

// `registry` is our own custom resource — the admin plugin's defaults only
// know about `user` and `session`. We extend them here.
const statement = {
    ...defaultStatements,
    registry: ['read', 'read_all']
};

const ac = createAccessControl(statement);

// Office Admin: can only "read" — actual office-level scoping happens in
// the controller (registryController.js), not here. This permission just
// marks that the role is allowed to hit the registry endpoints at all.
const officeAdmin = ac.newRole({
    registry: ['read']
});

// Portal Manager: inherits full admin-plugin permissions (manage users,
// bans, roles, etc. via auth.api.*) PLUS can read every office's records.
const portalManager = ac.newRole({
    ...adminAc.statements,
    registry: ['read', 'read_all']
});

module.exports = { ac, officeAdmin, portalManager };