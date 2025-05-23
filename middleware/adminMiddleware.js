const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        console.log(req.user)
        res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
};

module.exports = adminMiddleware;
