// Récup du modèle de sauce
const Sauce = require("../models/sauce");
// Intégration gestion de fichier
const fs = require("fs");
// Création sauce
exports.createSauce = (req, res) => {
	const sauceObject = JSON.parse(req.body.sauce); //transforme la sauce de json en object
	const sauce = new Sauce({
		...sauceObject,
		imageUrl: `${req.protocol}://${req.get("host")}/images/${
			req.file.filename
		}`, //Génère l'URL de l'image en créant une chaîne dynamique de l'URL
	});
	sauce
		.save()
		.then(() => res.status(201).json("Sauce créée !"))
		.catch((error) => res.status(400).json({ error }));
};
// récup détail sauce
exports.getOneSauce = (req, res) => {
	Sauce.findOne({
		_id: req.params.id,
	})
		.then((sauce) => {
			res.status(200).json(sauce);
		})
		.catch((error) => {
			res.status(404).json({
				error,
			});
		});
};
// modification de sauce
exports.modifySauce = (req, res) => {
	if (req.file) {
		//si on trouve un fichier image dans la requête alors
		Sauce.findOne({ _id: req.params.id }) //Recherche la sauce avec cet Id
			.then((sauce) => {
				const filename = sauce.imageUrl.split("/images/")[1];
				fs.unlink(`images/${filename}`, (err) => {
					//supprime cette photo qui est donc l'ancienne
					if (err) throw err;
				});
			})
			.catch((error) => res.status(400).json({ error }));
	}
	const sauceObject = req.file // si on trouve un fichier image dans la requête alors
		? {
				...JSON.parse(req.body.sauce), //on récupère l'objet json
				imageUrl: `${req.protocol}://${req.get("host")}/images/${
					req.file.filename
				}`, //et on ajoute l'image URL
		  }
		: { ...req.body }; //sinon on prend le corps de la requête
	Sauce.updateOne(
		{ _id: req.params.id },
		{ ...sauceObject, _id: req.params.id },
	) //On modifie celui dont l'ID est égale à l'ID envoyé dans les paramètres de requêtes
		.then(() => res.status(200).json({ message: "Sauce modifiée" }))
		.catch((error) => res.status(400).json({ error }));
};
//Suppression sauce
exports.deleteSauce = (req, res) => {
	Sauce.findOne({ _id: req.params.id })
		.then((sauce) => {
			const filename = sauce.imageUrl.split("/images/")[1];
			fs.unlink(`images/${filename}`, () => {
				Sauce.deleteOne({ _id: req.params.id })
					.then(() => res.status(200).json({ message: "Sauce supprimée !" }))
					.catch((error) => res.status(403).json({ error }));
			});
		})
		.catch((error) => res.status(500).json({ error }));
};
//Recup des sauces
exports.getAllSauces = (req, res) => {
	Sauce.find()
		.then((sauces) => {
			res.status(200).json(sauces);
		})
		.catch((error) => {
			res.status(404).json({
				error,
			});
		});
};

exports.likeSauce = (req, res) => {
	let like = req.body.like;
	let userId = req.body.userId;
	let sauceId = req.params.id;

	switch (like) {
		case 1: //like
			Sauce.updateOne(
				{ _id: sauceId },
				{ $push: { usersLiked: userId }, $inc: { likes: +1 } },
			)
				.then(() => res.status(200).json({ message: "J'aime" }))
				.catch((error) => res.status(400).json({ error }));
			console.log(req.body);
			break;

		case 0: //no like
			Sauce.findOne({ _id: sauceId })
				.then((sauce) => {
					if (sauce.usersLiked.includes(userId)) {
						Sauce.updateOne(
							{ _id: sauceId },
							{ $pull: { usersLiked: userId }, $inc: { likes: -1 } },
						)
							.then(() => res.status(200).json({ message: "Neutre" }))
							.catch((error) => res.status(400).json({ error }));
					}
					if (sauce.usersDisliked.includes(userId)) {
						Sauce.updateOne(
							{ _id: sauceId },
							{ $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } },
						)
							.then(() => res.status(200).json({ message: "Neutre" }))
							.catch((error) => res.status(400).json({ error }));
					}
					console.log(req.body);
				})
				.catch((error) => res.status(404).json({ error }));
			break;

		case -1: //dislike
			Sauce.updateOne(
				{ _id: sauceId },
				{ $push: { usersDisliked: userId }, $inc: { dislikes: +1 } },
			)
				.then(() => {
					res.status(200).json({ message: "Je n'aime pas" });
					console.log(req.body);
				})
				.catch((error) => res.status(400).json({ error }));
			break;

		default:
			console.log(error);
	}
};
