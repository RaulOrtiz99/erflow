import {DiagramData} from './diagram.model';


export type RoomRole = 'host' | 'editor'| 'viewer';

//definicion  de la estructura de una sala de diagramacion

export interface Room{
  id: string;
  name: string;
  description: string;
  host_id: string;
  created_at: Date;
  updated_at: Date;
  diagram_data: DiagramData;
  is_public: boolean;
}

export interface  RoomParticipant{
  room_id: string;
  user_id: string;
  role: RoomRole;
  joined_at: Date;
}
