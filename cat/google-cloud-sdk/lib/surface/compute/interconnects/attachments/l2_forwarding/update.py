# -*- coding: utf-8 -*- #
# Copyright 2025 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Command for updating L2 forwarding interconnect attachments."""

from googlecloudsdk.api_lib.compute import base_classes
from googlecloudsdk.api_lib.compute.interconnects.attachments import client
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.compute import flags as compute_flags
from googlecloudsdk.command_lib.compute.interconnects.attachments import flags as attachment_flags
from googlecloudsdk.command_lib.util.args import labels_util


@base.DefaultUniverseOnly
@base.ReleaseTracks(base.ReleaseTrack.ALPHA)
class Update(base.UpdateCommand):
  """Update a Compute Engine L2 forwarding interconnect attachment.

  *{command}* is used to update interconnect attachments. An interconnect
  attachment is what binds the underlying connectivity of an interconnect to a
  path into and out of the customer's cloud network.
  """
  INTERCONNECT_ATTACHMENT_ARG = None
  INTERCONNECT_ARG = None
  ROUTER_ARG = None

  def _get_attachment(self, args):
    holder = base_classes.ComputeApiHolder(self.ReleaseTrack())
    attachment_ref = self.INTERCONNECT_ATTACHMENT_ARG.ResolveAsResource(
        args,
        holder.resources,
        scope_lister=compute_flags.GetDefaultScopeLister(holder.client))
    return client.InterconnectAttachment(
        attachment_ref, compute_client=holder.client)

  @classmethod
  def Args(cls, parser):

    cls.INTERCONNECT_ATTACHMENT_ARG = (
        attachment_flags.InterconnectAttachmentArgument())
    cls.INTERCONNECT_ATTACHMENT_ARG.AddArgument(parser, operation_type='patch')
    attachment_flags.AddDescription(parser)
    attachment_flags.AddEnableAdmin(parser)
    attachment_flags.AddBandwidth(parser, required=False)
    attachment_flags.AddMtu(parser)
    attachment_flags.AddGeneveVni(parser)
    attachment_flags.AddDefaultApplianceIpAddress(parser)
    labels_util.AddUpdateLabelsFlags(parser)

  def Run(self, args):
    holder = base_classes.ComputeApiHolder(self.ReleaseTrack())
    interconnect_attachment = self._get_attachment(args)

    labels = None
    label_fingerprint = None
    labels_diff = labels_util.Diff.FromUpdateArgs(args)
    if labels_diff.MayHaveUpdates():
      old_attachment = interconnect_attachment.Describe()
      labels_cls = holder.client.messages.InterconnectAttachment.LabelsValue
      labels = labels_diff.Apply(
          labels_cls, labels=old_attachment.labels).GetOrNone()
      if labels is not None:
        label_fingerprint = old_attachment.labelFingerprint

    return interconnect_attachment.Patch(
        description=args.description,
        admin_enabled=args.enable_admin,
        labels=labels,
        label_fingerprint=label_fingerprint,
        bandwidth=getattr(args, 'bandwidth', None),
        mtu=getattr(args, 'mtu', None),
        geneve_vni=getattr(args, 'geneve_vni', None),
        default_appliance_ip_address=getattr(
            args, 'default_appliance_ip_address', None
        ),
    )
