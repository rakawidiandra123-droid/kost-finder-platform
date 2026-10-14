import Map "mo:core/Map";
import Types "../types/rooms";

module {
  public type Room = Types.Room;
  public type RoomId = Types.RoomId;
  public type RoomFilter = Types.RoomFilter;
  public type RoomInput = Types.RoomInput;

  func matchesFilter(room : Room, filter : RoomFilter) : Bool {
    let keywordOk = switch (filter.keyword) {
      case (?kw) {
        let term = kw.toLower();
        term == "" or room.name.toLower().contains(#text term);
      };
      case null { true };
    };
    let typeOk = switch (filter.roomType) {
      case (?rt) { room.roomType == rt };
      case null { true };
    };
    let minOk = switch (filter.minPrice) {
      case (?min) { room.monthlyPrice >= min };
      case null { true };
    };
    let maxOk = switch (filter.maxPrice) {
      case (?max) { room.monthlyPrice <= max };
      case null { true };
    };
    keywordOk and typeOk and minOk and maxOk;
  };

  public func listRooms(rooms : Map.Map<RoomId, Room>, filter : RoomFilter) : [Room] {
    rooms.values().filter(func room = matchesFilter(room, filter)).toArray();
  };

  public func getRoom(rooms : Map.Map<RoomId, Room>, id : RoomId) : ?Room {
    rooms.get(id);
  };

  public func createRoom(rooms : Map.Map<RoomId, Room>, nextId : { var value : Nat }, input : RoomInput) : Room {
    let id = nextId.value;
    nextId.value := id + 1;
    let room : Room = {
      id;
      name = input.name;
      roomType = input.roomType;
      monthlyPrice = input.monthlyPrice;
      description = input.description;
      facilities = input.facilities;
      status = input.status;
      photos = input.photos;
    };
    rooms.add(id, room);
    room;
  };

  public func updateRoom(rooms : Map.Map<RoomId, Room>, id : RoomId, input : RoomInput) : ?Room {
    switch (rooms.get(id)) {
      case (?existing) {
        let updated : Room = {
          id = existing.id;
          name = input.name;
          roomType = input.roomType;
          monthlyPrice = input.monthlyPrice;
          description = input.description;
          facilities = input.facilities;
          status = input.status;
          photos = input.photos;
        };
        rooms.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func deleteRoom(rooms : Map.Map<RoomId, Room>, id : RoomId) : Bool {
    switch (rooms.get(id)) {
      case (?_) {
        rooms.remove(id);
        true;
      };
      case null { false };
    };
  };
};
