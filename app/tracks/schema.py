import graphene
from graphene_django import DjangoObjectType

from .models import Track

class TrackType(DjangoObjectType):
    class Meta:
        model = Track

class Query(graphene.ObjectType):
    tracks = graphene.List(TrackType)

    def resolve_tracks(self, info):
        return Track.objects.all()

class CreateTrack(graphene.Mutation):
    track = graphene.Field(TrackType)

    class Arguments:
        title = graphene.String()
        description = graphene.String()
        url = graphene.String()

    def mutate(self, info, title, description, url):
        track = Track(title=title, description=description, url=url)       
        track.save()
        return CreateTrack(track=track)

class Mutation(graphene.ObjectType):
    create_track = CreateTrack.Field()