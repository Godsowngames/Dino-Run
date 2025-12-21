// FILE: backend.cpp
#include <crow.h>
#include <string>
#include <unordered_map>

struct GameConfig {
    std::string gameId;
    std::string playerName;
    std::string avatarBase64;
    std::string jumpSoundBase64;
    std::string deathSoundBase64;
    std::string visibility;
    long createdAt;
};

class GameStorage {
private:
    std::unordered_map<std::string, GameConfig> games;
    
public:
    std::string generateGameId() {
        const char chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        std::string id(8, ' ');
        for (int i = 0; i < 8; ++i) {
            id[i] = chars[rand() % 62];
        }
        return id;
    }
    
    bool storeGame(const GameConfig& config) {
        games[config.gameId] = config;
        return true;
    }
    
    GameConfig* getGame(const std::string& gameId) {
        auto it = games.find(gameId);
        if (it != games.end()) {
            return &it->second;
        }
        return nullptr;
    }
    
    std::vector<GameConfig> getPublicGames() {
        std::vector<GameConfig> publicGames;
        for (const auto& pair : games) {
            if (pair.second.visibility == "public") {
                publicGames.push_back(pair.second);
            }
        }
        return publicGames;
    }
};

int main() {
    crow::SimpleApp app;
    GameStorage storage;
    
    CROW_ROUTE(app, "/")
    ([]() {
        return "Custom Dino Game API";
    });
    
    CROW_ROUTE(app, "/api/games").methods("POST"_method)
    ([&storage](const crow::request& req) {
        auto json = crow::json::load(req.body);
        if (!json) return crow::response(400);
        
        GameConfig config;
        config.gameId = storage.generateGameId();
        config.playerName = json["playerName"].s();
        config.visibility = json["visibility"].s();
        config.createdAt = time(nullptr);
        
        if (json.has("avatarBase64"))
            config.avatarBase64 = json["avatarBase64"].s();
        if (json.has("jumpSoundBase64"))
            config.jumpSoundBase64 = json["jumpSoundBase64"].s();
        if (json.has("deathSoundBase64"))
            config.deathSoundBase64 = json["deathSoundBase64"].s();
        
        storage.storeGame(config);
        
        crow::json::wvalue response;
        response["gameId"] = config.gameId;
        response["status"] = "created";
        return crow::response(201, response);
    });
    
    CROW_ROUTE(app, "/api/games/<string>")
    ([&storage](const std::string& gameId) {
        auto game = storage.getGame(gameId);
        if (!game) return crow::response(404);
        
        crow::json::wvalue response;
        response["gameId"] = game->gameId;
        response["playerName"] = game->playerName;
        response["visibility"] = game->visibility;
        return crow::response(response);
    });
    
    CROW_ROUTE(app, "/api/games/public")
    ([&storage]() {
        auto games = storage.getPublicGames();
        crow::json::wvalue::list gamesList;
        
        for (const auto& game : games) {
            crow::json::wvalue gameJson;
            gameJson["gameId"] = game.gameId;
            gameJson["playerName"] = game.playerName;
            gamesList.push_back(gameJson);
        }
        
        crow::json::wvalue response;
        response["games"] = std::move(gamesList);
        return crow::response(response);
    });
    
    app.port(8080).multithreaded().run();
    return 0;
}