import { Client, Databases, Query, ID } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject(PROJECT_ID);

const databases = new Databases(client);

const hasAppwriteConfig =
  PROJECT_ID && DATABASE_ID && COLLECTION_ID;

export const updateSearchCount = async (searchTerm, movie) => {
    if (!hasAppwriteConfig) {
        console.error(
            "Missing Appwrite env vars. Check VITE_APPWRITE_PROJECT_ID, VITE_APPWRITE_DATABASE_ID, and VITE_APPWRITE_COLLECTION_ID."
        );
        return;
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) return;

    try {
        const result = await databases.listDocuments({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            queries: [Query.equal("searchTerm", normalizedTerm)],
        });

        if (result.documents.length > 0) {
            const doc = result.documents[0];

            await databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: COLLECTION_ID,
                documentId: doc.$id,
                data: {
                    count: doc.count + 1,
                },
            });
        } else {
            await databases.createDocument({
                databaseId: DATABASE_ID,
                collectionId: COLLECTION_ID,
                documentId: ID.unique(),
                data: {
                    searchTerm: normalizedTerm,
                    count: 1,
                    movie_id: movie?.id || 0,
                    poster_url: movie?.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "https://placehold.co/500x750?text=No+Poster",
                },
            });
        }
    } catch (error) {
        console.error("Appwrite updateSearchCount failed:", error);
    }
};

export const getTrendingMovies = async () => {
    try {
        const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc("count")
        ])

        return result.documents;

    } catch (error) {
        console.error(error);
    }
}