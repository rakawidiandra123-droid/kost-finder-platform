import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/rooms";
import RoomsLib "../lib/rooms";

mixin (
  rooms : Map.Map<Types.RoomId, Types.Room>,
  nextRoomId : { var value : Nat },
  accessControlState : AccessControl.AccessControlState,
) {
  public query func listRooms(filter : Types.RoomFilter) : async [Types.Room] {
    RoomsLib.listRooms(rooms, filter);
  };

  public query func getRoom(id : Types.RoomId) : async ?Types.Room {
    RoomsLib.getRoom(rooms, id);
  };

  public shared ({ caller }) func createRoom(input : Types.RoomInput) : async Types.Room {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Hanya admin yang dapat menambah kamar");
    };
    RoomsLib.createRoom(rooms, nextRoomId, input);
  };

  public shared ({ caller }) func updateRoom(id : Types.RoomId, input : Types.RoomInput) : async ?Types.Room {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Hanya admin yang dapat mengubah kamar");
    };
    RoomsLib.updateRoom(rooms, id, input);
  };

  public shared ({ caller }) func deleteRoom(id : Types.RoomId) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Hanya admin yang dapat menghapus kamar");
    };
    RoomsLib.deleteRoom(rooms, id);
  };
};
